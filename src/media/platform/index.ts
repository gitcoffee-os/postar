import { reactive } from 'vue';

import { platformMetas as enPlatformMetas } from '@gitcoffee/postbot-publisher-en';

export const platformMetas = reactive(enPlatformMetas);

const createPlatform = (type: string, code: string, customProps: Record<string, any> = {}) => {
    const meta = platformMetas[code];
    if (!meta) {
        console.warn(`Platform meta not found for code: ${code}`);
        return reactive({ type, code, ...customProps });
    }
    return reactive({
        type,
        ...meta,
        ...customProps,
    });
};

export const platforms = reactive({
    article: {
        facebook: createPlatform('article', 'facebook', { sort: 1 }),
        linkedin: createPlatform('article', 'linkedin', { sort: 2 }),
        instagram: createPlatform('article', 'instagram', { sort: 3 }),
        x: createPlatform('article', 'x', { sort: 4, name: 'X(Premium)', platformName: 'X(Premium)' }),
        reddit: createPlatform('article', 'reddit', { sort: 5 }),
        threads: createPlatform('article', 'threads', { sort: 6 }),
        bluesky: createPlatform('article', 'bluesky', { sort: 7 }),
        medium: createPlatform('article', 'medium', { sort: 8 }),
        substack: createPlatform('article', 'substack', { sort: 9 }),
        devto: createPlatform('article', 'devto', { sort: 10 }),
        hashnode: createPlatform('article', 'hashnode', { sort: 11 }),
        github: createPlatform('article', 'github', { sort: 12 }),
        wordpress: createPlatform('article', 'wordpress', { sort: 13 }),
        blogger: createPlatform('article', 'blogger', { sort: 14 }),
        ghost: createPlatform('article', 'ghost', { sort: 15 }),
    },
    moment: {
        x: createPlatform('moment', 'x', { sort: 1 }),
        facebook: createPlatform('moment', 'facebook', { sort: 2 }),
        instagram: createPlatform('moment', 'instagram', { sort: 3 }),
        linkedin: createPlatform('moment', 'linkedin', { sort: 4 }),
        threads: createPlatform('moment', 'threads', { sort: 5 }),
        bluesky: createPlatform('moment', 'bluesky', { sort: 6 }),
        reddit: createPlatform('moment', 'reddit', { sort: 7 }),
        tiktok: createPlatform('moment', 'tiktok', { sort: 8, status: 'disabled' }),
        discord: createPlatform('moment', 'discord', { sort: 9, status: 'disabled' }),
        telegram: createPlatform('moment', 'telegram', { sort: 10, status: 'disabled' }),
        pinterest: createPlatform('moment', 'pinterest', { sort: 11, status: 'disabled' }),
        whatsapp: createPlatform('moment', 'whatsapp', { sort: 12, status: 'disabled' }),
    },
    video: {
        youtube: createPlatform('video', 'youtube', { sort: 1 }),
        tiktok: createPlatform('video', 'tiktok', { sort: 2, publishUrl: 'https://www.tiktok.com/tiktokstudio/upload' }),
        x_video: createPlatform('video', 'x_video', { sort: 3, status: 'disabled' }),
        facebook_reels: createPlatform('video', 'facebook_reels', { sort: 4 }),
        instagram_reels: createPlatform('video', 'instagram_reels', { sort: 5 }),
        pinterest_video: createPlatform('video', 'pinterest_video', { sort: 6 }),
        dailymotion: createPlatform('video', 'dailymotion', { sort: 7, status: 'disabled' }),
        twitch: createPlatform('video', 'twitch', { sort: 8, status: 'disabled' }),
        vimeo: createPlatform('video', 'vimeo', { sort: 9, status: 'disabled' }),
    },
    audio: {
        spotify: createPlatform('audio', 'spotify', { sort: 1, status: 'disabled' }),
        apple_music: createPlatform('audio', 'apple_music', { sort: 2, status: 'disabled' }),
        soundcloud: createPlatform('audio', 'soundcloud', { sort: 3, status: 'disabled' }),
        audiomack: createPlatform('audio', 'audiomack', { sort: 4, status: 'disabled' }),
        deezer: createPlatform('audio', 'deezer', { sort: 5, status: 'disabled' }),
        tidal: createPlatform('audio', 'tidal', { sort: 6, status: 'disabled' }),
    },
});

const sortPlatforms = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
    const isPlatformObj = Object.values(obj).some(
        (v) => typeof v === 'object' && v !== null && 'sort' in v
    );
    if (!isPlatformObj) {
        let result: any = {};
        for (const key in obj) {
            result[key] = sortPlatforms(obj[key]);
        }
        return result;
    }
    const entries = Object.entries(obj)
        .map(([k, v]) => [k, sortPlatforms(v)])
        .sort((a, b) => {
            let sa = (a[1] as any)?.sort ?? 0;
            let sb = (b[1] as any)?.sort ?? 0;
            return sa - sb;
        });
    const sorted: any = {};
    for (const [k, v] of entries) {
        sorted[k] = v;
    }
    return sorted;
};

const filterDisabledPlatforms = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
    const isPlatformObj = Object.values(obj).some(
        (v) => typeof v === 'object' && v !== null && 'sort' in v
    );
    if (!isPlatformObj) {
        let result: any = {};
        for (const key in obj) {
            const filtered = filterDisabledPlatforms(obj[key]);
            if (filtered && typeof filtered === 'object' && !Array.isArray(filtered) && Object.keys(filtered).length === 0) {
                continue;
            }
            result[key] = filtered;
        }
        return result;
    }
    const filtered: any = {};
    for (const [k, v] of Object.entries(obj)) {
        if ((v as any)?.status === 'disabled') continue;
        filtered[k] = filterDisabledPlatforms(v);
    }
    return filtered;
};

export const getPlatforms = () => {
    return sortPlatforms(filterDisabledPlatforms(platforms));
};
