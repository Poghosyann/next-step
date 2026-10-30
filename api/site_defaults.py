"""Default content for the public landing page.

Used when no custom content has been saved from the admin panel yet,
and to fill in any sections missing from saved content.
"""
import copy

DEFAULT_SITE_CONTENT = {
    "meta": {
        "title": "Հաշվապահական Դասընթացներ | Սովորեք զրոյից",
        "description": "Գործնական հաշվապահական դասընթաց սկսնակների համար՝ իրական փաստաթղթերով, ՀԾ-ով, հարկային հաշվետվություններով:"
    },
    "header": {
        "logo": "logo.png",
        "cta_text": "Գրանցվել",
        "nav": [
            {"label": "Գլխավոր", "href": "#hero"},
            {"label": "Դասընթաց", "href": "#about"},
            {"label": "Ծրագիր", "href": "#program"},
            {"label": "Տեսադարան", "href": "#gallery"},
            {"label": "Դասախոս", "href": "#instructor"},
            {"label": "Կարծիքներ", "href": "#reviews"},
            {"label": "ՀՏՀ", "href": "#faq"},
            {"label": "Կապ", "href": "#contact"}
        ]
    },
    "hero": {
        "title": "Սովորեք հաշվապահություն զրոյից և սկսեք աշխատել",
        "highlight": "արդեն իսկ 5 ամսից",
        "subtitle": "Գործնական դասընթաց սկսնակների համար՝ իրական փաստաթղթերով, ՀԾ-ով, հարկային հաշվետվություններով։",
        "primary_btn": "Գրանցվել դասընթացին",
        "secondary_btn": "Ստանալ անվճար խորհրդատվություն",
        "image_main": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=700",
        "image_secondary": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400&h=300",
        "stat_value": "98%",
        "stat_label": "Գոհունակություն"
    },
    "features": {
        "title": "Ինչու՞ ընտրել մեզ",
        "items": [
            {"icon": "fa-solid fa-money-bill-trend-up", "title": "Եկամտային հարկի վերադարձի հնարավորություն", "highlight": True},
            {"icon": "fa-solid fa-award", "title": "ԿԳՄՍ երաշխավորված", "highlight": True},
            {"icon": "fa-solid fa-laptop-file", "title": "Օնլայն, օֆֆլայն ուսուցում", "highlight": False},
            {"icon": "fa-solid fa-credit-card", "title": "Ապառիկ ուսուցում", "highlight": False},
            {"icon": "fa-solid fa-seedling", "title": "Զրոյից՝ սկսնակների համար", "highlight": False},
            {"icon": "fa-solid fa-briefcase", "title": "90% պրակտիկա", "highlight": False},
            {"icon": "fa-solid fa-file-invoice", "title": "Իրական փաստաթղթեր", "highlight": False},
            {"icon": "fa-solid fa-users", "title": "Փոքր խմբեր", "highlight": False},
            {"icon": "fa-solid fa-certificate", "title": "Վկայական", "highlight": False},
            {"icon": "fa-solid fa-handshake", "title": "Աշխատանքի տեղավորման աջակցություն", "highlight": False}
        ]
    },
    "program": {
        "title": "Դասընթացի ծրագիրը",
        "items": [
            {"text": "Հաշվապահական հաշվառման հիմունքներ"},
            {"text": "Աշխատանքային օրենսդրություն՝ աշխատավարձի հաշվարկ, պայմանագիր և այլն"},
            {"text": "Հարկային օրենսդրություն՝ հաշվետվությունների և հայտարարությունների լրացում"},
            {"text": "ՀԾ Հաշվապահ ծրագրի ուսուցում՝ զրոյից"},
            {"text": "Պրակտիկ գործնական առաջադրանքների կատարում՝ աշխատանքային պրակտիկա"}
        ]
    },
    "outcomes": {
        "title": "Ինչ կստանաք ավարտելուց հետո",
        "items": [
            {"text": "Կկարողանաք աշխատել որպես սկսնակ հաշվապահ"},
            {"text": "Կաշխատեք ՀԾ Հաշվապահ ծրագրով"},
            {"text": "Կլրացնեք հարկային հաշվետվություններ"},
            {"text": "ԿԳՄՍ նախարարության կողմից երաշխավորված դասընթացի վկայական"},
            {"text": "Կունենաք պատրաստի աշխատանքային հմտություններ"}
        ]
    },
    "formats": {
        "title": "Դասընթացի ձևաչափ",
        "items": [
            {"icon": "fa-solid fa-laptop-house", "title": "Օնլայն", "wide": False},
            {"icon": "fa-solid fa-building", "title": "Օֆլայն", "wide": False},
            {"icon": "fa-solid fa-user-group", "title": "Փոքր խմբեր", "wide": False},
            {"icon": "fa-solid fa-user-tie", "title": "Անհատական", "wide": False},
            {"icon": "fa-solid fa-clock", "title": "Առավոտյան, Ցերեկային և Երեկոյան խմբեր", "wide": True}
        ]
    },
    "gallery": {
        "title": "Տեսադարան",
        "subtitle": "Դիտեք մեր դասապրոցեսի, միջոցառումների և վկայականների հանձնման լուսանկարներն ու տեսանյութերը",
        "items": [
            {
                "type": "photo",
                "title": "Թիմային քննարկում և պրակտիկ աշխատանք",
                "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200&h=800",
                "youtube_url": ""
            },
            {
                "type": "photo",
                "title": "Լսարանային դասընթաց փոքր խմբերով",
                "image": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200&h=800",
                "youtube_url": ""
            },
            {
                "type": "photo",
                "title": "ԿԳՄՍ երաշխավորված վկայականների հանձնում",
                "image": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200&h=800",
                "youtube_url": ""
            }
        ]
    },
    "instructors": {
        "items": [
            {
                "name": "Անուն Ազգանուն",
                "role": "",
                "bio": "",
                "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=500&h=600"
            }
        ]
    },
    "stats": {
        "items": [
            {"value": "350+", "label": "Շրջանավարտ"},
            {"value": "55+", "label": "Խմբեր"},
            {"value": "98%", "label": "Գոհունակություն"},
            {"value": "80%", "label": "Աշխատանքի անցած ուսանողներ"}
        ]
    },
    "reviews": {
        "title": "Ուսանողների կարծիքներ",
        "videos": [
            {
                "title": "Տեսանյութեր մեր ուսանողներից",
                "text": "Դիտեք մեր շրջանավարտների տպավորությունները և հաջողության պատմությունները։",
                "youtube_url": "",
                "thumbnail": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600&h=400"
            }
        ],
        "items": [
            {
                "text": "«Շատ գոհ եմ դասընթացներից։ Ամեն ինչ շատ պարզ էր ու մատչելի, գործնական առաջադրանքները օգնեցին անմիջապես յուրացնել նյութը։ Ավարտելուց 1 ամիս անց արդեն ընդունվեցի աշխատանքի։»",
                "name": "Անի Մարտիրոսյան",
                "role": "Շրջանավարտ, այժմ՝ Հաշվապահ",
                "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100"
            }
        ]
    },
    "faq": {
        "title": "Հաճախ տրվող հարցեր",
        "subtitle": "Չե՞ք գտել Ձեր հարցի պատասխանը։ Կապ հաստատեք մեզ հետ։",
        "items": [
            {"question": "Պետք է մաթեմատիկա՞ լավ իմանալ", "answer": "Ոչ, հատուկ մաթեմատիկական խորը գիտելիքներ չեն պահանջվում: Բավարար է թվաբանության բազային իմացությունը: Ամբողջ գործընթացը կատարվում է հատուկ ծրագրերի և բանաձևերի միջոցով:"},
            {"question": "Քանի՞ ամիս է տևում դասընթացը", "answer": "Ամբողջական պրակտիկ դասընթացը տևում է 5 ամիս, որը բավարար է զրոյից մասնագիտությունը յուրացնելու և աշխատանքի անցնելու համար:"},
            {"question": "Արդյո՞ք դասընթացը սկսնակների համար է", "answer": "Այո, մեր ծրագիրը հատուկ մշակված է այնպես, որ նույնիսկ ոլորտի հետ երբևէ առնչություն չունեցած մարդիկ կարողանան հեշտությամբ սովորել:"},
            {"question": "Վկայական տրամադրու՞մ եք", "answer": "Այո, դասընթացը հաջողությամբ ավարտելուց հետո և ավարտական թեստը հանձնելուց հետո տրամադրվում է ԿԳՄՍ նախարարության կողմից երաշխավորված դասընթացի վկայական:"},
            {"question": "Օնլայն կարո՞ղ եմ սովորել", "answer": "Այո, մենք ունենք ինչպես օֆլայն դասընթացներ, այնպես էլ օնլայն ուսուցման ձևաչափ, որը կազմակերպվում է Zoom հարթակով:"},
            {"question": "Աշխատանքի տեղավորման հարցում աջակցու՞մ եք", "answer": "Այո, մենք կապեր ունենք բազմաթիվ գործատուների հետ և լավագույն ուսանողներին ուղղորդում ենք թափուր հաստիքների՝ ինչպես նաև օգնում կազմել պրոֆեսիոնալ CV:"},
            {"question": "Համակարգչի առկայությունը պարտադի՞ր է", "answer": "Այո, քանի որ աշխատանքի 90%-ը գործնական է և արվում է համակարգչային ծրագրերով (Excel, ՀԾ և այլն), ցանկալի է ունենալ անձնական համակարգիչ:"}
        ]
    },
    "registration": {
        "title": "Գրանցման ձև",
        "subtitle": "Լրացրեք տվյալները և մենք կկապվենք Ձեզ հետ մանրամասները քննարկելու համար:",
        "submit_text": "Գրանցվել դասընթացին",
        "success_text": "Շնորհակալություն, հայտը ընդունված է! Մենք շուտով կկապվենք Ձեզ հետ։",
        "courses": [
            {"name": "Ֆինանսական հաշվառում"},
            {"name": "Հարկային հաշվառում"},
            {"name": "1C ՀԾ ծրագրեր"},
            {"name": "Գլխավոր հաշվապահի դասընթաց"},
            {"name": "Excel դասընթաց"}
        ]
    },
    "contact": {
        "title": "Կոնտակտներ",
        "address": "Արմենակ Արմենակյան 125/3",
        "address_url": "https://www.google.com/maps/search/?api=1&query=Արմենակ+Արմենակյան+125/3,+Երևան",
        "phone_label": "Հեռախոս / WhatsApp / Telegram",
        "phone": "+374 98 99 44 10",
        "email": "info@nextstep.am",
        "facebook": "",
        "instagram": "",
        "whatsapp": "",
        "telegram": ""
    },
    "callback": {
        "button_text": "Պատվիրել զանգ",
        "title": "Պատվիրել զանգ",
        "subtitle": "Թողեք Ձեր հեռախոսահամարը և մեր մասնագետը կզանգահարի Ձեզ",
        "success_text": "Շնորհակալություն! Մենք շուտով կզանգահարենք Ձեզ։"
    },
    "footer": {
        "copyright": "© 2026 NEXT-STEP ACADEMY. Բոլոր իրավունքները պաշտպանված են:",
        "links": []
    }
}


def get_default_content():
    return copy.deepcopy(DEFAULT_SITE_CONTENT)


def merge_with_defaults(saved):
    """Fill in sections/fields that are missing from saved content."""
    result = get_default_content()
    if not isinstance(saved, dict):
        return result
    for section, value in saved.items():
        if isinstance(value, dict) and isinstance(result.get(section), dict):
            merged = dict(result[section])
            merged.update(value)
            result[section] = merged
        else:
            result[section] = value
    return result
