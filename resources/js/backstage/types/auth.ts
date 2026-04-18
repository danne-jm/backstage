export type FooterLink = {
    label: string;
    url: string;
    icon: string;
};

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    role: string;
    permissions: string[];
    attributes: Record<string, unknown> | null;
    footer_links: FooterLink[] | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
