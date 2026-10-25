import type {HTMLAttributes,ElementType} from 'react';
export default function GlassCard({as:Tag='div',className='',...props}:HTMLAttributes<HTMLElement>&{as?:ElementType}){return <Tag className={'glass-card '+className} {...props}/>;}
