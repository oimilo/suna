'use client';

import React from 'react';
import { 
  SiGmail, 
  SiTrello, 
  SiDropbox, 
  SiZendesk, 
  SiDiscord, 
  SiTelegram, 
  SiGooglecalendar, 
  SiAsana, 
  SiClickup, 
  SiGoogledrive, 
  SiSupabase, 
  SiStripe, 
  SiPaypal, 
  SiCanva,
  SiNotion,
  SiSlack,
  SiGithub
} from 'react-icons/si';
import { FaCalendarAlt, FaMicrosoft } from 'react-icons/fa';

const appLogos = [
  { Icon: SiGmail, name: 'Gmail' },
  { Icon: SiTrello, name: 'Trello' },
  { Icon: SiDropbox, name: 'Dropbox' },
  { Icon: SiZendesk, name: 'Zendesk' },
  { Icon: FaCalendarAlt, name: 'Calendly' },
  { Icon: SiDiscord, name: 'Discord' },
  { Icon: SiTelegram, name: 'Telegram' },
  { Icon: FaMicrosoft, name: 'Microsoft' },
  { Icon: SiGooglecalendar, name: 'Google Calendar' },
  { Icon: SiNotion, name: 'Notion' },
  { Icon: SiAsana, name: 'Asana' },
  { Icon: SiClickup, name: 'ClickUp' },
  { Icon: SiSlack, name: 'Slack' },
  { Icon: SiGoogledrive, name: 'Google Drive' },
  { Icon: SiSupabase, name: 'Supabase' },
  { Icon: SiStripe, name: 'Stripe' },
  { Icon: SiPaypal, name: 'PayPal' },
  { Icon: SiGithub, name: 'GitHub' },
  { Icon: SiCanva, name: 'Canva' },
];

export function AppLogosSlider() {
  return (
    <div className="w-full overflow-hidden py-8 mt-3">
      {/* Tag acima do rotator */}
      <div className="flex justify-center mb-9">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/5">
          <p className="text-xs text-purple-300">
            Integre com as ferramentas que você já usa
          </p>
        </div>
      </div>
      <div className="relative">
        {/* Removido gradientes - usando mask-image ao invés */}
        <div 
          className="flex"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
          }}
        >
          {/* First set of logos */}
          <div className="flex items-center gap-12 animate-scroll-left whitespace-nowrap">
            {appLogos.map((app, index) => (
              <div
                key={`first-${index}`}
                className="flex items-center justify-center opacity-40 hover:opacity-60 transition-opacity duration-300"
              >
                <app.Icon className="h-8 w-8 text-white" />
              </div>
            ))}
          </div>
          
          {/* Duplicate set for continuous scroll */}
          <div className="flex items-center gap-12 animate-scroll-left whitespace-nowrap ml-12">
            {appLogos.map((app, index) => (
              <div
                key={`second-${index}`}
                className="flex items-center justify-center opacity-40 hover:opacity-60 transition-opacity duration-300"
              >
                <app.Icon className="h-8 w-8 text-white" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}