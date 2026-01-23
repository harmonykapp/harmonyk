"use client";
 
 import { CollapsibleTrigger } from "@/components/ui/collapsible";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { cn } from "@/lib/utils";
 import { ChevronDown } from "lucide-react";
 import * as React from "react";
 
 type Props = {
   title: string;
   subtitle?: string;
   open: boolean;
   controlsId?: string;
   leadingIcon?: React.ReactNode;
   buttonClassName?: string;
   titleClassName?: string;
   subtitleClassName?: string;
 };
 
 export function CollapsibleHeaderButton({
   title,
   subtitle,
   open,
   controlsId,
   leadingIcon,
   buttonClassName,
   titleClassName,
   subtitleClassName,
 }: Props) {
   return (
     <TooltipProvider delayDuration={150}>
       <Tooltip>
         <TooltipTrigger asChild>
           <CollapsibleTrigger
             type="button"
             className={cn(
               "flex min-h-9 w-full items-start gap-3 rounded-md px-2 py-1.5 text-left",
               "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
               buttonClassName,
             )}
             aria-controls={controlsId}
             aria-expanded={open}
           >
             <span className="flex min-w-0 items-start gap-2">
               {leadingIcon ? <span className="mt-0.5 shrink-0">{leadingIcon}</span> : null}
               <span className="min-w-0">
                 <span className="inline-flex items-center gap-1">
                   <span className={cn("text-base font-semibold", titleClassName)}>{title}</span>
                   <ChevronDown
                     className={cn(
                       "h-4 w-4 text-muted-foreground transition-transform",
                       open ? "rotate-180" : "rotate-0",
                     )}
                   />
                 </span>
                 {subtitle ? (
                   <span className={cn("mt-0.5 block text-xs font-normal text-muted-foreground", subtitleClassName)}>
                     {subtitle}
                   </span>
                 ) : null}
               </span>
             </span>
             <span className="sr-only">{open ? "Collapse" : "Expand"}</span>
           </CollapsibleTrigger>
         </TooltipTrigger>
         <TooltipContent side="top" align="start">
           {open ? "Collapse" : "Expand"}
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   );
 }
