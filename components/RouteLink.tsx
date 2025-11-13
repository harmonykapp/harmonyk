"use client";

import { isAppRoute } from "@/lib/routes";
import type { AppRoute } from "@/types/routes";
import Link, { LinkProps } from "next/link";
import type { PropsWithChildren } from "react";

type RouteLinkProps = Omit<LinkProps, "href"> & {
    href: AppRoute;
    className?: string;
};

export default function RouteLink({
    href,
    children,
    className,
    ...rest
}: PropsWithChildren<RouteLinkProps>) {
    if (!isAppRoute(href)) {
        // Extra safety; usually caught by TS before runtime.
        throw new Error(`Invalid AppRoute href: ${href}`);
    }
    return (
        <Link href={href} className={className} {...rest}>
            {children}
        </Link>
    );
}
