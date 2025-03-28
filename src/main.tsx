
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// تأكد من وجود عنصر root قبل تثبيت التطبيق
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("لم يتم العثور على عنصر مع معرف 'root'");
}
