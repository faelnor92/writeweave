
// components/Sidebar.tsx
import React from 'react';
import type { View } from '../types.ts';
import BookOpenIcon from './icons/BookOpenIcon.tsx';
import UsersIcon from './icons/UsersIcon.tsx';
import MapPinIcon from './icons/MapPinIcon.tsx';
import WrenchIcon from './icons/WrenchIcon.tsx';
import LogoIcon from './icons/LogoIcon.tsx';
import EyeIcon from './icons/EyeIcon.tsx';
import ImageIcon from './icons/ImageIcon.tsx';
import SunIcon from './icons/SunIcon.tsx';
import MoonIcon from './icons/MoonIcon.tsx';
import BarChart2Icon from './icons/BarChart2Icon.tsx';
import TargetIcon from './icons/TargetIcon.tsx';
import SettingsIcon from './icons/SettingsIcon.tsx';
import PrinterIcon from './icons/PrinterIcon.tsx';
import TimelineIcon from './icons/TimelineIcon.tsx';
import UsersRoundIcon from './icons/UsersRoundIcon.tsx';
import ClipboardListIcon from './icons/ClipboardListIcon.tsx';
import PaintbrushIcon from './icons/PaintbrushIcon.tsx';
import { useI18n } from '../hooks/useI18n.ts';


interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  goHome: () => void;
  className?: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const SidebarButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = React.memo(({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex flex-col items-center justify-center p-3 text-xs font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
      }`}
    >
      <React.Fragment>
        {icon}
        <span className="mt-1">{label}</span>
      </React.Fragment>
    </button>
  );
});
SidebarButton.displayName = 'SidebarButton';

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, goHome, theme, toggleTheme, className = '' }) => {
  const { t } = useI18n();
  
  const mainNavItems = [
    { id: 'editor', label: t('sidebar.editor'), icon: <BookOpenIcon /> },
    { id: 'plan', label: t('sidebar.plan'), icon: <ClipboardListIcon /> },
    { id: 'preview', label: t('sidebar.preview'), icon: <EyeIcon /> },
  ];
  
  const worldBuildingItems = [
    { id: 'characters', label: t('sidebar.characters'), icon: <UsersIcon /> },
    { id: 'relationshipMap', label: t('sidebar.relationships'), icon: <UsersRoundIcon /> },
    { id: 'places', label: t('sidebar.places'), icon: <MapPinIcon /> },
    { id: 'images', label: t('sidebar.images'), icon: <ImageIcon /> },
    { id: 'timeline', label: t('sidebar.timeline'), icon: <TimelineIcon /> },
  ];

  const advancedTools = [
    { id: 'analytics', label: t('sidebar.analytics'), icon: <BarChart2Icon /> },
    { id: 'marketing', label: t('sidebar.marketing'), icon: <TargetIcon /> },
    { id: 'styleStudio', label: t('sidebar.styleStudio'), icon: <PaintbrushIcon /> },
    { id: 'tools', label: t('sidebar.tools'), icon: <WrenchIcon /> },
  ];

  const systemItems = [
     { id: 'publication', label: t('sidebar.publication'), icon: <PrinterIcon /> },
     { id: 'settings', label: t('sidebar.settings'), icon: <SettingsIcon /> },
  ];

  return (
    <nav className={`bg-surface-light dark:bg-surface-dark w-24 flex flex-col items-center flex-shrink-0 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${className}`}>
      {/* Home Button */}
      <div className="flex-shrink-0">
        <button onClick={goHome} className="p-4 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors" title={t('app.backToHome')}>
          <LogoIcon className="w-8 h-8" />
        </button>
      </div>

      {/* Scrollable Nav Items */}
      <div className="flex-grow overflow-y-auto w-full">
        <div className="space-y-1 py-2">
          {mainNavItems.map((item) => (
            <SidebarButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id as View)}
            />
          ))}
          <hr className="my-2 border-gray-200 dark:border-gray-700 w-3/4 mx-auto"/>
          {worldBuildingItems.map((item) => (
            <SidebarButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id as View)}
            />
          ))}
          <hr className="my-2 border-gray-200 dark:border-gray-700 w-3/4 mx-auto"/>
          {advancedTools.map((item) => (
            <SidebarButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id as View)}
            />
          ))}
           <hr className="my-2 border-gray-200 dark:border-gray-700 w-3/4 mx-auto"/>
           {systemItems.map((item) => (
              <SidebarButton
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  isActive={activeView === item.id}
                  onClick={() => setActiveView(item.id as View)}
              />
          ))}
        </div>
      </div>
      
      {/* Theme Toggle Button */}
      <div className="flex-shrink-0 w-full mb-4 mt-2">
        <button
          onClick={toggleTheme}
          className="w-full flex flex-col items-center justify-center p-3 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          title={t('sidebar.themeSwitch', { theme: theme === 'light' ? 'sombre' : 'clair' })}
        >
          <React.Fragment>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            <span className="mt-1">{t('sidebar.theme')}</span>
          </React.Fragment>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
