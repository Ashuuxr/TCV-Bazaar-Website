import { createFileRoute } from '@tanstack/react-router'
import PublicLayout from '@/layouts/PublicLayout'

const META_PIXEL_STATIC_CODE = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '884820438041779');
fbq('track', 'PageView');
`

export const Route = createFileRoute('/_public')({
  head: () => ({
    scripts: [
      {
        attrs: { 'data-tcv-meta-pixel-static': 'true' },
        children: META_PIXEL_STATIC_CODE,
      },
    ],
  }),
  component: PublicLayout,
})
