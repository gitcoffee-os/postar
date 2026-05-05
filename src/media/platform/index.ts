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
        medium: createPlatform('article', 'medium', {
            name: 'Medium',
            publishUrl: 'https://medium.com/new-story',
            sort: 1,
            status: 'enabled',
        }),
        devto: createPlatform('article', 'devto', {
            name: 'Dev.to',
            publishUrl: 'https://dev.to/new',
            sort: 2,
            status: 'enabled',
        }),
        github: createPlatform('article', 'github', {
            name: 'GitHub',
            publishUrl: 'https://github.com/new',
            sort: 3,
            status: 'enabled',
        }),
        hashnode: createPlatform('article', 'hashnode', {
            name: 'Hashnode',
            publishUrl: 'https://hashnode.com/new-story',
            sort: 4,
            status: 'enabled',
        }),
        blogger: createPlatform('article', 'blogger', {
            name: 'Blogger',
            publishUrl: 'https://www.blogger.com/create-post.g',
            sort: 5,
            status: 'enabled',
        }),
        wordpress: createPlatform('article', 'wordpress', {
            name: 'WordPress.com',
            publishUrl: 'https://wordpress.com/post',
            sort: 6,
            status: 'enabled',
        }),
        substack: createPlatform('article', 'substack', {
            name: 'Substack',
            publishUrl: 'https://substack.com/publish',
            sort: 7,
            status: 'enabled',
        }),
        ghost: createPlatform('article', 'ghost', {
            name: 'Ghost',
            publishUrl: 'https://ghost.org/login/',
            sort: 8,
            status: 'enabled',
        }),
        x: createPlatform('article', 'x', {
            name: 'X',
            publishUrl: 'https://x.com/compose/note',
            sort: 9,
            status: 'enabled',
        }),
    },
    moment: {
        linkedin: createPlatform('moment', 'linkedin', {
            name: 'LinkedIn',
            publishUrl: 'https://www.linkedin.com/post/new/',
            sort: 1,
            status: 'enabled',
        }),
        x: createPlatform('moment', 'x', {
            name: 'X',
            publishUrl: 'https://x.com/compose/post',
            sort: 2,
            status: 'enabled',
        }),
        facebook: createPlatform('moment', 'facebook', {
            name: 'Facebook',
            publishUrl: 'https://www.facebook.com/creation/tools/post',
            sort: 3,
            status: 'enabled',
        }),
        instagram: createPlatform('moment', 'instagram', {
            name: 'Instagram',
            publishUrl: 'https://www.instagram.com/create/post/',
            sort: 4,
            status: 'enabled',
        }),
        reddit: createPlatform('moment', 'reddit', {
            name: 'Reddit',
            publishUrl: 'https://www.reddit.com/submit',
            sort: 5,
            status: 'enabled',
        }),
        pinterest: createPlatform('moment', 'pinterest', {
            name: 'Pinterest',
            publishUrl: 'https://www.pinterest.com/pin/create/button/',
            sort: 6,
            status: 'enabled',
        }),
        tiktok: createPlatform('moment', 'tiktok', {
            name: 'TikTok',
            publishUrl: 'https://www.tiktok.com/upload',
            sort: 7,
            status: 'enabled',
        }),
        telegram: createPlatform('moment', 'telegram', {
            name: 'Telegram',
            publishUrl: 'https://web.telegram.org/',
            sort: 8,
            status: 'enabled',
        }),
        discord: createPlatform('moment', 'discord', {
            name: 'Discord',
            publishUrl: 'https://discord.com/app',
            sort: 9,
            status: 'enabled',
        }),
        threads: createPlatform('moment', 'threads', {
            name: 'Threads',
            publishUrl: 'https://www.threads.net/',
            sort: 10,
            status: 'enabled',
        }),
        bluesky: createPlatform('moment', 'bluesky', {
            name: 'Bluesky',
            publishUrl: 'https://bsky.app/',
            sort: 11,
            status: 'enabled',
        }),
        whatsapp: createPlatform('moment', 'whatsapp', {
            name: 'WhatsApp',
            publishUrl: 'https://web.whatsapp.com/',
            sort: 12,
            status: 'enabled',
        }),
    },
    video: {
        youtube: createPlatform('video', 'youtube', {
            name: 'YouTube',
            publishUrl: 'https://www.youtube.com/upload',
            sort: 1,
            status: 'enabled',
        }),
        tiktok: createPlatform('video', 'tiktok', {
            name: 'TikTok',
            publishUrl: 'https://www.tiktok.com/upload',
            sort: 2,
            status: 'enabled',
        }),
        facebook_video: createPlatform('video', 'facebook_video', {
            name: 'Facebook Video',
            publishUrl: 'https://www.facebook.com/creation/tools/video',
            sort: 3,
            status: 'enabled',
        }),
        instagram_reels: createPlatform('video', 'instagram_reels', {
            name: 'Instagram Reels',
            publishUrl: 'https://www.instagram.com/create/reel/',
            sort: 4,
            status: 'enabled',
        }),
        dailymotion: createPlatform('video', 'dailymotion', {
            name: 'Dailymotion',
            publishUrl: 'https://www.dailymotion.com/upload',
            sort: 5,
            status: 'enabled',
        }),
        twitch: createPlatform('video', 'twitch', {
            name: 'Twitch',
            publishUrl: 'https://www.twitch.tv/dashboard/upload',
            sort: 6,
            status: 'enabled',
        }),
        vimeo: createPlatform('video', 'vimeo', {
            name: 'Vimeo',
            publishUrl: 'https://vimeo.com/upload',
            sort: 7,
            status: 'enabled',
        }),
    },
    audio: {
        spotify: createPlatform('audio', 'spotify', {
            name: 'Spotify',
            publishUrl: 'https://artists.spotify.com/c/artist/overview',
            sort: 1,
            status: 'enabled',
        }),
        apple_music: createPlatform('audio', 'apple_music', {
            name: 'Apple Music',
            publishUrl: 'https://artists.apple.com/',
            sort: 2,
            status: 'enabled',
        }),
        google_podcasts: createPlatform('audio', 'google_podcasts', {
            name: 'Google Podcasts',
            publishUrl: 'https://podcasts.google.com/publish',
            sort: 3,
            status: 'enabled',
        }),
        soundcloud: createPlatform('audio', 'soundcloud', {
            name: 'SoundCloud',
            publishUrl: 'https://soundcloud.com/upload',
            sort: 4,
            status: 'enabled',
        }),
        audiomack: createPlatform('audio', 'audiomack', {
            name: 'Audiomack',
            publishUrl: 'https://www.audiomack.com/upload',
            sort: 5,
            status: 'enabled',
        }),
        deezer: createPlatform('audio', 'deezer', {
            name: 'Deezer',
            publishUrl: 'https://www.deezer.com/',
            sort: 6,
            status: 'enabled',
        }),
        tidal: createPlatform('audio', 'tidal', {
            name: 'Tidal',
            publishUrl: 'https://tidal.com/',
            sort: 7,
            status: 'enabled',
        }),
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

export const getPlatforms = () => {
    return sortPlatforms(platforms);
};
