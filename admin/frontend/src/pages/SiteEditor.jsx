import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import {
  Save, RotateCcw, ExternalLink, Plus, Trash2, ChevronUp, ChevronDown, Upload, X,
  Image as ImageIcon, Video, Layout, Star, ListChecks, GraduationCap, Grid3x3, Film,
  UserSquare2, BarChart3, MessageSquareQuote, HelpCircle, ClipboardList, Phone, PhoneCall,
  PanelBottom, Menu, Globe, Loader2, LogOut, KeyRound
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const parseYouTubeId = (url) => {
  if (!url) return null;
  const s = String(url).trim();
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
};

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const readAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const prepareImage = async (file, maxDim = 1920) => {
  if (file.type === 'image/gif') return readAsDataURL(file);
  const src = await readAsDataURL(file);
  const img = await new Promise((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  let out = canvas.toDataURL('image/webp', 0.85);
  if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', 0.85);
  return out;
};

const ICON_PRESETS = [
  'fa-solid fa-money-bill-trend-up', 'fa-solid fa-award', 'fa-solid fa-laptop-file', 'fa-solid fa-credit-card',
  'fa-solid fa-seedling', 'fa-solid fa-briefcase', 'fa-solid fa-file-invoice', 'fa-solid fa-users',
  'fa-solid fa-certificate', 'fa-solid fa-handshake', 'fa-solid fa-laptop-house', 'fa-solid fa-building',
  'fa-solid fa-user-group', 'fa-solid fa-user-tie', 'fa-solid fa-clock', 'fa-solid fa-graduation-cap',
  'fa-solid fa-book-open', 'fa-solid fa-calculator', 'fa-solid fa-chart-line', 'fa-solid fa-coins',
  'fa-solid fa-percent', 'fa-solid fa-star', 'fa-solid fa-medal', 'fa-solid fa-trophy',
  'fa-solid fa-calendar-check', 'fa-solid fa-video', 'fa-solid fa-headset', 'fa-solid fa-shield-halved',
  'fa-solid fa-lightbulb', 'fa-solid fa-rocket', 'fa-solid fa-gift', 'fa-solid fa-location-dot'
];

const SECTIONS = [
  {
    key: 'hero', label: 'Գլխավոր բաժին', icon: Layout,
    fields: [
      { name: 'title', label: 'Վերնագիր', type: 'textarea' },
      { name: 'highlight', label: 'Ընդգծված մաս (նարնջագույն)' },
      { name: 'subtitle', label: 'Ենթավերնագիր', type: 'textarea' },
      { name: 'primary_btn', label: 'Հիմնական կոճակի տեքստ' },
      { name: 'secondary_btn', label: 'Երկրորդային կոճակի տեքստ' },
      { name: 'image_main', label: 'Հիմնական նկար', type: 'image' },
      { name: 'image_secondary', label: 'Երկրորդային նկար', type: 'image' },
      { name: 'stat_value', label: 'Քարտի թիվ (օր.՝ 98%)' },
      { name: 'stat_label', label: 'Քարտի տեքստ' }
    ]
  },
  {
    key: 'features', label: 'Առավելություններ', icon: Star,
    fields: [{ name: 'title', label: 'Բաժնի վերնագիր' }],
    lists: [{
      name: 'items', label: 'Առավելություններ', itemLabel: 'Առավելություն', titleField: 'title',
      fields: [
        { name: 'title', label: 'Տեքստ' },
        { name: 'icon', label: 'Պատկերակ', type: 'icon' },
        { name: 'highlight', label: 'Նարնջագույն ֆոնով', type: 'checkbox' }
      ],
      newItem: { title: '', icon: 'fa-solid fa-star', highlight: false }
    }]
  },
  {
    key: 'program', label: 'Դասընթացի ծրագիր', icon: ListChecks,
    fields: [{ name: 'title', label: 'Բաժնի վերնագիր' }],
    lists: [{
      name: 'items', label: 'Ծրագրի կետեր', itemLabel: 'Կետ', titleField: 'text',
      fields: [{ name: 'text', label: 'Տեքստ', type: 'textarea' }],
      newItem: { text: '' }
    }]
  },
  {
    key: 'outcomes', label: 'Ինչ կստանաք', icon: GraduationCap,
    fields: [{ name: 'title', label: 'Բաժնի վերնագիր' }],
    lists: [{
      name: 'items', label: 'Արդյունքներ', itemLabel: 'Կետ', titleField: 'text',
      fields: [{ name: 'text', label: 'Տեքստ', type: 'textarea' }],
      newItem: { text: '' }
    }]
  },
  {
    key: 'formats', label: 'Դասընթացի ձևաչափ', icon: Grid3x3,
    fields: [{ name: 'title', label: 'Բաժնի վերնագիր' }],
    lists: [{
      name: 'items', label: 'Ձևաչափեր', itemLabel: 'Ձևաչափ', titleField: 'title',
      fields: [
        { name: 'title', label: 'Տեքստ' },
        { name: 'icon', label: 'Պատկերակ', type: 'icon' },
        { name: 'wide', label: 'Լայն քարտ (ամբողջ տողով)', type: 'checkbox' }
      ],
      newItem: { title: '', icon: 'fa-solid fa-star', wide: false }
    }]
  },
  {
    key: 'gallery', label: 'Տեսադարան', icon: Film,
    fields: [
      { name: 'title', label: 'Բաժնի վերնագիր' },
      { name: 'subtitle', label: 'Ենթավերնագիր', type: 'textarea' }
    ],
    lists: [{
      name: 'items', label: 'Վիդեոներ և նկարներ', itemLabel: 'Նյութ', titleField: 'title',
      fields: [
        { name: 'type', label: 'Տեսակ', type: 'select', options: [{ value: 'photo', label: 'Նկար' }, { value: 'video', label: 'Վիդեո (YouTube)' }] },
        { name: 'title', label: 'Վերնագիր' },
        { name: 'youtube_url', label: 'YouTube հղում', type: 'youtube', showIf: (it) => it.type === 'video' },
        { name: 'image', label: 'Նկար', type: 'image', showIf: (it) => it.type !== 'video' },
        { name: 'image', label: 'Շապիկի նկար (ոչ պարտադիր, լռելյայն՝ YouTube-ի շապիկը)', type: 'image', showIf: (it) => it.type === 'video' }
      ],
      newItem: { type: 'video', title: '', youtube_url: '', image: '' }
    }]
  },
  {
    key: 'instructors', label: 'Դասախոսներ', icon: UserSquare2,
    lists: [{
      name: 'items', label: 'Դասախոսներ', itemLabel: 'Դասախոս', titleField: 'name',
      fields: [
        { name: 'name', label: 'Անուն Ազգանուն' },
        { name: 'role', label: 'Պաշտոն / մասնագիտացում' },
        { name: 'bio', label: 'Կենսագրություն', type: 'textarea' },
        { name: 'photo', label: 'Լուսանկար', type: 'image' }
      ],
      newItem: { name: '', role: '', bio: '', photo: '' }
    }]
  },
  {
    key: 'stats', label: 'Արդյունքներ (թվեր)', icon: BarChart3,
    lists: [{
      name: 'items', label: 'Թվեր', itemLabel: 'Ցուցանիշ', titleField: 'label',
      fields: [
        { name: 'value', label: 'Թիվ (օր.՝ 350+)' },
        { name: 'label', label: 'Նկարագրություն' }
      ],
      newItem: { value: '', label: '' }
    }]
  },
  {
    key: 'reviews', label: 'Կարծիքներ', icon: MessageSquareQuote,
    fields: [{ name: 'title', label: 'Բաժնի վերնագիր' }],
    lists: [
      {
        name: 'videos', label: 'Վիդեո կարծիքներ', itemLabel: 'Վիդեո', titleField: 'title',
        fields: [
          { name: 'title', label: 'Վերնագիր' },
          { name: 'text', label: 'Նկարագրություն', type: 'textarea' },
          { name: 'youtube_url', label: 'YouTube հղում', type: 'youtube' },
          { name: 'thumbnail', label: 'Շապիկի նկար (ոչ պարտադիր)', type: 'image' }
        ],
        newItem: { title: '', text: '', youtube_url: '', thumbnail: '' }
      },
      {
        name: 'items', label: 'Գրավոր կարծիքներ', itemLabel: 'Կարծիք', titleField: 'name',
        fields: [
          { name: 'text', label: 'Կարծիք', type: 'textarea' },
          { name: 'name', label: 'Անուն Ազգանուն' },
          { name: 'role', label: 'Կարգավիճակ (օր.՝ Շրջանավարտ)' },
          { name: 'photo', label: 'Լուսանկար', type: 'image' }
        ],
        newItem: { text: '', name: '', role: '', photo: '' }
      }
    ]
  },
  {
    key: 'faq', label: 'Հաճախ տրվող հարցեր', icon: HelpCircle,
    fields: [
      { name: 'title', label: 'Բաժնի վերնագիր' },
      { name: 'subtitle', label: 'Ենթավերնագիր' }
    ],
    lists: [{
      name: 'items', label: 'Հարցեր', itemLabel: 'Հարց', titleField: 'question',
      fields: [
        { name: 'question', label: 'Հարց' },
        { name: 'answer', label: 'Պատասխան', type: 'textarea' }
      ],
      newItem: { question: '', answer: '' }
    }]
  },
  {
    key: 'registration', label: 'Գրանցման ձև', icon: ClipboardList,
    fields: [
      { name: 'title', label: 'Վերնագիր' },
      { name: 'subtitle', label: 'Ենթավերնագիր', type: 'textarea' },
      { name: 'submit_text', label: 'Կոճակի տեքստ' },
      { name: 'success_text', label: 'Հաջող ուղարկման հաղորդագրություն', type: 'textarea' }
    ],
    lists: [{
      name: 'courses', label: 'Նախընտրելի դասընթացների ցանկ', itemLabel: 'Դասընթաց', titleField: 'name',
      fields: [{ name: 'name', label: 'Դասընթացի անվանում' }],
      newItem: { name: '' }
    }]
  },
  {
    key: 'contact', label: 'Կոնտակտներ', icon: Phone,
    fields: [
      { name: 'title', label: 'Բաժնի վերնագիր' },
      { name: 'address', label: 'Հասցե' },
      { name: 'address_url', label: 'Հասցեի հղում (Google Maps)', type: 'url' },
      { name: 'phone_label', label: 'Հեռախոսի պիտակ' },
      { name: 'phone', label: 'Հեռախոսահամար' },
      { name: 'email', label: 'Էլ. փոստ' },
      { name: 'facebook', label: 'Facebook հղում', type: 'url' },
      { name: 'instagram', label: 'Instagram հղում', type: 'url' },
      { name: 'whatsapp', label: 'WhatsApp հղում', type: 'url' },
      { name: 'telegram', label: 'Telegram հղում', type: 'url' }
    ]
  },
  {
    key: 'callback', label: 'Պատվիրել զանգ', icon: PhoneCall,
    fields: [
      { name: 'button_text', label: 'Կոճակի տեքստ' },
      { name: 'title', label: 'Պատուհանի վերնագիր' },
      { name: 'subtitle', label: 'Պատուհանի ենթավերնագիր', type: 'textarea' },
      { name: 'success_text', label: 'Հաջող ուղարկման հաղորդագրություն' }
    ]
  },
  {
    key: 'header', label: 'Մենյու և լոգո', icon: Menu,
    fields: [
      { name: 'logo', label: 'Լոգո', type: 'image' },
      { name: 'cta_text', label: 'Մենյուի կոճակի տեքստ' }
    ],
    lists: [{
      name: 'nav', label: 'Մենյուի հղումներ', itemLabel: 'Հղում', titleField: 'label',
      fields: [
        { name: 'label', label: 'Տեքստ' },
        { name: 'href', label: 'Հղում (օր.՝ #faq)' }
      ],
      newItem: { label: '', href: '#' }
    }]
  },
  {
    key: 'footer', label: 'Ստորագիր (Footer)', icon: PanelBottom,
    fields: [{ name: 'copyright', label: 'Հեղինակային իրավունքի տեքստ' }],
    lists: [{
      name: 'links', label: 'Հղումներ', itemLabel: 'Հղում', titleField: 'label',
      fields: [
        { name: 'label', label: 'Տեքստ' },
        { name: 'href', label: 'Հղում' }
      ],
      newItem: { label: '', href: '#' }
    }]
  },
  {
    key: 'meta', label: 'SEO', icon: Globe,
    fields: [
      { name: 'title', label: 'Էջի վերնագիր (browser tab)' },
      { name: 'description', label: 'Նկարագրություն (Google)', type: 'textarea' }
    ]
  }
];

const ImageField = ({ value, onChange }) => {
  const { addToast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Խնդրում ենք ընտրել նկարի ֆայլ', 'warning');
      return;
    }
    try {
      setUploading(true);
      const dataUrl = await prepareImage(file);
      if (dataUrl.length * 0.75 > MAX_UPLOAD_BYTES) {
        addToast('Նկարը չափազանց մեծ է (առավելագույնը 4MB)', 'error');
        return;
      }
      const res = await api.post('/site-images', { data_url: dataUrl, filename: file.name });
      onChange(res.data.url);
      addToast('Նկարը վերբեռնվեց', 'success');
    } catch (err) {
      console.error(err);
      addToast(err.response?.status === 401 ? 'Մուտքի ժամկետը լրացել է, մուտք գործեք կրկին' : 'Սխալ նկարը վերբեռնելիս', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-3 items-start">
      <div className="w-28 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={22} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-brand/15 hover:bg-brand/25 text-gray-800 border border-brand/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Վերբեռնվում է...' : 'Վերբեռնել նկար'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
            >
              <X size={14} /> Հեռացնել
            </button>
          )}
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="կամ տեղադրեք նկարի հղումը"
          className="glass-input w-full text-xs py-1.5"
        />
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
};

const YouTubeField = ({ value, onChange }) => {
  const id = parseYouTubeId(value);
  return (
    <div className="flex gap-3 items-start">
      <div className="w-28 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
        {id ? (
          <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" />
        ) : (
          <Video size={22} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="glass-input w-full text-sm"
        />
        {value && !id && (
          <p className="text-xs text-red-500 mt-1">Հղումը YouTube-ի վավեր հղում չէ</p>
        )}
        {id && (
          <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer" className="text-xs text-brand font-semibold mt-1 inline-flex items-center gap-1 hover:underline">
            Դիտել YouTube-ում <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
};

const IconField = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex gap-2 items-center">
        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-brand/10 flex items-center justify-center text-brand shrink-0">
          <i className={value || 'fa-solid fa-star'} />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="fa-solid fa-star"
          className="glass-input flex-1 text-sm"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap cursor-pointer"
        >
          {open ? 'Փակել' : 'Ընտրել'}
        </button>
      </div>
      {open && (
        <div className="grid grid-cols-8 gap-1.5 mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          {ICON_PRESETS.map((ic) => (
            <button
              key={ic}
              type="button"
              title={ic}
              onClick={() => { onChange(ic); setOpen(false); }}
              className={`h-9 rounded-md flex items-center justify-center transition cursor-pointer ${value === ic ? 'bg-brand text-black' : 'bg-white text-gray-600 hover:bg-brand/15 border border-gray-200'}`}
            >
              <i className={ic} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Field = ({ field, value, onChange }) => {
  const label = <label className="block text-xs font-bold text-gray-600 mb-1">{field.label}</label>;
  switch (field.type) {
    case 'textarea':
      return (
        <div>{label}
          <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} className="glass-input w-full text-sm resize-y" />
        </div>
      );
    case 'image':
      return <div>{label}<ImageField value={value} onChange={onChange} /></div>;
    case 'youtube':
      return <div>{label}<YouTubeField value={value} onChange={onChange} /></div>;
    case 'icon':
      return <div>{label}<IconField value={value} onChange={onChange} /></div>;
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#f3b01b]" />
          {field.label}
        </label>
      );
    case 'select':
      return (
        <div>{label}
          <select value={value || field.options[0].value} onChange={(e) => onChange(e.target.value)} className="glass-input w-full text-sm">
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    default:
      return (
        <div>{label}
          <input type={field.type === 'url' ? 'url' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="glass-input w-full text-sm" />
        </div>
      );
  }
};

const ListEditor = ({ list, items, onChange }) => {
  const safeItems = Array.isArray(items) ? items : [];

  const updateItem = (idx, name, val) => {
    const next = safeItems.map((it, i) => (i === idx ? { ...it, [name]: val } : it));
    onChange(next);
  };
  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= safeItems.length) return;
    const next = [...safeItems];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const remove = (idx) => {
    if (!window.confirm(`Ջնջե՞լ այս ${list.itemLabel.toLowerCase()}ը`)) return;
    onChange(safeItems.filter((_, i) => i !== idx));
  };
  const add = () => onChange([...safeItems, { ...list.newItem }]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          {list.label} <span className="text-gray-400 font-semibold">({safeItems.length})</span>
        </h3>
        <button type="button" onClick={add} className="glass-button px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={14} /> Ավելացնել
        </button>
      </div>

      {safeItems.length === 0 && (
        <div className="p-6 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          Ցանկը դատարկ է։ Սեղմեք «Ավելացնել»
        </div>
      )}

      <div className="space-y-3">
        {safeItems.map((item, idx) => (
          <div key={idx} className="bg-gray-50/70 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold text-gray-500 truncate">
                #{idx + 1} · {(item[list.titleField] || '').toString().slice(0, 70) || `Նոր ${list.itemLabel.toLowerCase()}`}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30 cursor-pointer" title="Վերև">
                  <ChevronUp size={16} />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === safeItems.length - 1} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30 cursor-pointer" title="Ներքև">
                  <ChevronDown size={16} />
                </button>
                <button type="button" onClick={() => remove(idx)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Ջնջել">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.fields
                .filter((f) => !f.showIf || f.showIf(item))
                .map((f, fIdx) => (
                  <div key={`${f.name}-${fIdx}`} className={['textarea', 'image', 'youtube', 'icon'].includes(f.type) ? 'md:col-span-2' : ''}>
                    <Field field={f} value={item[f.name]} onChange={(v) => updateItem(idx, f.name, v)} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SiteEditor = ({ onLogout }) => {
  const { addToast } = useToast();
  const [content, setContent] = useState(null);
  const [activeKey, setActiveKey] = useState(SECTIONS[0].key);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      const res = await api.get('/site-content');
      setContent(res.data);
      setDirty(false);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const updateSection = (key, name, val) => {
    setContent((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [name]: val } }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/site-content', content);
      setContent(res.data);
      setDirty(false);
      addToast('Կայքի տվյալները պահպանվեցին', 'success');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        addToast('Մուտքի ժամկետը լրացել է, մուտք գործեք կրկին', 'error');
        onLogout();
      } else {
        addToast('Սխալ պահպանելիս', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Վերականգնե՞լ կայքի սկզբնական բովանդակությունը։ Բոլոր փոփոխությունները կջնջվեն։')) return;
    try {
      const res = await api.post('/site-content/reset');
      setContent(res.data);
      setDirty(false);
      addToast('Սկզբնական բովանդակությունը վերականգնվեց', 'success');
    } catch (err) {
      console.error(err);
      addToast('Սխալ վերականգնելիս', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Նոր գաղտնաբառը պետք է լինի առնվազն 6 նիշ');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Գաղտնաբառերը չեն համընկնում');
      return;
    }
    try {
      setChangingPassword(true);
      await api.put('/site-admin/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      addToast('Գաղտնաբառը հաջողությամբ փոխվեց', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Սխալ ընթացիկ գաղտնաբառ');
    } finally {
      setChangingPassword(false);
    }
  };

  const section = SECTIONS.find((s) => s.key === activeKey);
  const sectionData = content?.[activeKey] || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/20 border border-brand text-gray-900 rounded-xl flex items-center justify-center font-black">
              <Globe size={22} className="text-gray-900" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 leading-tight">
                Next Step Admin
              </h1>
              <p className="text-xs text-gray-400">Կայքի կառավարման վահանակ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <ExternalLink size={14} /> Դիտել կայքը
            </a>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
              title="Փոխել գաղտնաբառը"
            >
              <KeyRound size={14} /> Գաղտնաբառ
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!content}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw size={14} /> Սկզբնական
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!content || saving || !dirty}
              className="glass-button px-4 py-1.5 text-xs flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Պահպանվում է...' : 'Պահպանել'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1 cursor-pointer"
              title="Դուրս գալ"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {dirty && (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium flex items-center justify-between">
            <span>Ունեք չպահպանված փոփոխություններ։ Սեղմեք «Պահպանել», որպեսզի դրանք երևան կայքում։</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition cursor-pointer"
            >
              Պահպանել հիմա
            </button>
          </div>
        )}

        {loadError ? (
          <div className="glass-panel p-10 text-center">
            <p className="text-gray-500 mb-4">Չհաջողվեց բեռնել կայքի տվյալները</p>
            <button type="button" onClick={load} className="glass-button px-6 py-2 text-sm cursor-pointer">
              Կրկին փորձել
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Section nav */}
            <nav className="glass-panel p-2 w-full lg:w-64 shrink-0 lg:sticky lg:top-20">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = s.key === activeKey;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveKey(s.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-brand/15 text-gray-900 font-bold border border-brand/30'
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-brand' : 'text-gray-400'} />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            {/* Editor */}
            <div className="glass-panel p-6 flex-1 min-w-0 w-full">
              {!content ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-48 bg-gray-200 rounded" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                      <div className="h-10 w-full bg-gray-100 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                    <section.icon size={20} className="text-brand" /> {section.label}
                  </h2>
                  {section.fields && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields.map((f) => (
                        <div key={f.name} className={['textarea', 'image', 'youtube', 'icon'].includes(f.type) ? 'md:col-span-2' : ''}>
                          <Field field={f} value={sectionData[f.name]} onChange={(v) => updateSection(activeKey, f.name, v)} />
                        </div>
                      ))}
                    </div>
                  )}
                  {(section.lists || []).map((list) => (
                    <ListEditor
                      key={list.name}
                      list={list}
                      items={sectionData[list.name]}
                      onChange={(items) => updateSection(activeKey, list.name, items)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <KeyRound size={20} className="text-brand" /> Փոխել գաղտնաբառը
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-lg mb-4 text-xs font-medium border border-rose-200">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Ընթացիկ գաղտնաբառ</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="glass-input w-full text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Նոր գաղտնաբառ (առնվազն 6 նիշ)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input w-full text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Կրկնել նոր գաղտնաբառը</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="glass-button px-5 py-2 text-xs cursor-pointer"
                >
                  {changingPassword ? 'Փոխվում է...' : 'Պահպանել նոր գաղտնաբառը'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteEditor;
