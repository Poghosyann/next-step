import { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-gray-900 text-white';
          let icon = <Info size={18} className="text-blue-400 shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-900 text-emerald-100 border border-emerald-700/50';
            icon = <CheckCircle size={18} className="text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-950 text-rose-100 border border-rose-800/50';
            icon = <AlertCircle size={18} className="text-rose-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-950 text-amber-100 border border-amber-800/50';
            icon = <AlertCircle size={18} className="text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl shadow-xl pointer-events-auto transition-all transform duration-200 text-sm ${bg}`}
            >
              {icon}
              <div className="flex-1 font-medium leading-tight pt-0.5">{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition p-0.5"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
