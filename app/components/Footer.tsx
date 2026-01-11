export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-4 px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>© {currentYear} Naad Official. All rights reserved.</p>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Contact
          </a>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-500">Follow us:</span>
          <div className="flex gap-2">
            <a href="#" className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              <span className="text-lg">📘</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              <span className="text-lg">🐦</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              <span className="text-lg">📷</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
