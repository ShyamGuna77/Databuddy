

export interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    footer?: {
        text: string;
        icon_url?: string;
    };
    timestamp?: string;
    author?: {
        name: string;
        icon_url?: string;
        url?: string;
    };
    thumbnail?: {
        url: string;
    };
    url?: string;
}

export interface DiscordWebhookMessage {
    content?: string;
    username?: string;
    avatar_url?: string;
    embeds?: DiscordEmbed[];
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogMessage {
    level: LogLevel;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    userId?: string;
    timestamp?: Date;
}

const LOG_COLORS = {
    info: 0x3498db,
    success: 0x2ecc71,
    warning: 0xf39c12,
    error: 0xe74c3c,
    debug: 0x9b59b6
} as const;

const LOG_EMOJIS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🐛'
} as const;

class DiscordWebhook {
    private webhookUrl: string;
    private defaultUsername: string;
    private defaultAvatarUrl?: string;
    private rateLimitQueue: Array<() => Promise<void>> = [];
    private isProcessingQueue = false;

    constructor(
        webhookUrl: string,
        options: {
            defaultUsername?: string;
            defaultAvatarUrl?: string;
        } = {}
    ) {
        this.webhookUrl = webhookUrl;
        this.defaultUsername = options.defaultUsername || 'DataBuddy';
        this.defaultAvatarUrl = options.defaultAvatarUrl;
    }

    async sendMessage(content: string, options: Partial<DiscordWebhookMessage> = {}): Promise<boolean> {
        return this.send({
            content,
            username: this.defaultUsername,
            avatar_url: this.defaultAvatarUrl,
            ...options
        });
    }

    async sendEmbed(embed: DiscordEmbed, options: Partial<DiscordWebhookMessage> = {}): Promise<boolean> {
        return this.send({
            embeds: [embed],
            username: this.defaultUsername,
            avatar_url: this.defaultAvatarUrl,
            ...options
        });
    }

    async sendLog(logMessage: LogMessage): Promise<boolean> {
        const { level, title, message, metadata, userId, timestamp = new Date() } = logMessage;

        const embed: DiscordEmbed = {
            title: `${LOG_EMOJIS[level]} ${title}`,
            description: message,
            color: LOG_COLORS[level],
            timestamp: timestamp.toISOString(),
            fields: []
        };

        if (metadata && Object.keys(metadata).length > 0) {
            if (!embed.fields) embed.fields = [];
            for (const [key, value] of Object.entries(metadata)) {
                embed.fields.push({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: this.formatValue(value),
                    inline: true
                });
            }
        }

        if (userId) {
            if (!embed.fields) embed.fields = [];
            embed.fields.push({
                name: 'User ID',
                value: userId,
                inline: true
            });
        }

        embed.footer = {
            text: `Environment: ${process.env.NODE_ENV || 'unknown'} | ${new Date().toLocaleString()}`
        };

        return this.sendEmbed(embed);
    }


    async logInfo(title: string, message: string, metadata?: Record<string, unknown>): Promise<boolean> {
        return this.sendLog({ level: 'info', title, message, metadata });
    }

    async logSuccess(title: string, message: string, metadata?: Record<string, unknown>): Promise<boolean> {
        return this.sendLog({ level: 'success', title, message, metadata });
    }

    async logWarning(title: string, message: string, metadata?: Record<string, unknown>): Promise<boolean> {
        return this.sendLog({ level: 'warning', title, message, metadata });
    }

    async logError(title: string, message: string, metadata?: Record<string, unknown>): Promise<boolean> {
        return this.sendLog({ level: 'error', title, message, metadata });
    }

    async logDebug(title: string, message: string, metadata?: Record<string, unknown>): Promise<boolean> {
        return this.sendLog({ level: 'debug', title, message, metadata });
    }


    async logUserActivity(
        action: string,
        userId: string,
        details?: Record<string, unknown>
    ): Promise<boolean> {
        return this.sendLog({
            level: 'info',
            title: 'User Activity',
            message: action,
            metadata: details,
            userId
        });
    }


    async logException(error: Error, context?: Record<string, unknown>): Promise<boolean> {
        const metadata: Record<string, unknown> = {
            'Error Name': error.name,
            'Stack Trace': `\`\`\`\n${(error.stack || 'No stack trace available').slice(0, 1000)}\n\`\`\``,
            ...context
        };

        return this.sendLog({
            level: 'error',
            title: 'Application Error',
            message: error.message,
            metadata
        });
    }


    async sendSystemNotification(
        title: string,
        message: string,
        level: LogLevel = 'info'
    ): Promise<boolean> {
        const embed: DiscordEmbed = {
            title: `🔔 ${title}`,
            description: message,
            color: LOG_COLORS[level],
            timestamp: new Date().toISOString(),
            footer: {
                text: `DataBuddy System | ${process.env.NODE_ENV || 'unknown'}`
            }
        };

        return this.sendEmbed(embed);
    }


    private async send(payload: DiscordWebhookMessage): Promise<boolean> {
        return new Promise((resolve) => {
            this.rateLimitQueue.push(async () => {
                try {
                    const response = await fetch(this.webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
                        resolve(false);
                        return;
                    }

                    resolve(true);
                } catch (error) {
                    console.error('Discord webhook error:', error);
                    resolve(false);
                }
            });

            this.processQueue();
        });
    }


    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.rateLimitQueue.length > 0) {
            const task = this.rateLimitQueue.shift();
            if (task) {
                await task();

                await new Promise(resolve => setTimeout(resolve, 400));
            }
        }

        this.isProcessingQueue = false;
    }


    private formatValue(value: unknown): string {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        if (typeof value === 'object') {
            return `\`\`\`json\n${JSON.stringify(value, null, 2).slice(0, 500)}\n\`\`\``;
        }

        return String(value);
    }
}

let defaultWebhook: DiscordWebhook | null = null;
let errorWebhook: DiscordWebhook | null = null;
let activityWebhook: DiscordWebhook | null = null;
export function initializeDiscordWebhook(webhookUrl: string, options?: {
    defaultUsername?: string;
    defaultAvatarUrl?: string;
}): DiscordWebhook {
    defaultWebhook = new DiscordWebhook(webhookUrl, options);
    return defaultWebhook;
}


export function initializeErrorWebhook(webhookUrl: string): DiscordWebhook {
    errorWebhook = new DiscordWebhook(webhookUrl, {
        defaultUsername: 'DataBuddy Errors',
        defaultAvatarUrl: undefined
    });
    return errorWebhook;
}


export function initializeActivityWebhook(webhookUrl: string): DiscordWebhook {
    activityWebhook = new DiscordWebhook(webhookUrl, {
        defaultUsername: 'DataBuddy Activity',
        defaultAvatarUrl: undefined
    });
    return activityWebhook;
}


export function getDefaultWebhook(): DiscordWebhook | null {
    return defaultWebhook;
}


export function getErrorWebhook(): DiscordWebhook | null {
    return errorWebhook;
}


export function getActivityWebhook(): DiscordWebhook | null {
    return activityWebhook;
}


export const discord = {
    log: {
        info: (title: string, message: string, metadata?: Record<string, unknown>) =>
            defaultWebhook?.logInfo(title, message, metadata),
        success: (title: string, message: string, metadata?: Record<string, unknown>) =>
            defaultWebhook?.logSuccess(title, message, metadata),
        warning: (title: string, message: string, metadata?: Record<string, unknown>) =>
            defaultWebhook?.logWarning(title, message, metadata),
        error: (title: string, message: string, metadata?: Record<string, unknown>) =>
            defaultWebhook?.logError(title, message, metadata),
        debug: (title: string, message: string, metadata?: Record<string, unknown>) =>
            defaultWebhook?.logDebug(title, message, metadata),
    },

    sendMessage: (content: string, options?: Partial<DiscordWebhookMessage>) =>
        defaultWebhook?.sendMessage(content, options),

    sendEmbed: (embed: DiscordEmbed, options?: Partial<DiscordWebhookMessage>) =>
        defaultWebhook?.sendEmbed(embed, options),

    logException: (error: Error, context?: Record<string, unknown>) =>
        errorWebhook?.logException(error, context) || defaultWebhook?.logException(error, context),

    logUserActivity: (action: string, userId: string, details?: Record<string, unknown>) =>
        activityWebhook?.logUserActivity(action, userId, details) || defaultWebhook?.logUserActivity(action, userId, details),

    notify: (title: string, message: string, level: LogLevel = 'info') =>
        defaultWebhook?.sendSystemNotification(title, message, level),
};

export { DiscordWebhook };

const DATABUDDY_WEBHOOK_URL = 'https://discord.com/api/webhooks/1379061559762092134/F6OLoVYCOTMzpHm8sUlQxSPJIYDyd3aUgKRm_OL2pC8bTe9VF9Fa5gyT1k1_xuc-5gz4';

export const dataBuddyWebhook = new DiscordWebhook(DATABUDDY_WEBHOOK_URL, {
    defaultUsername: 'Databuddy',
    defaultAvatarUrl: undefined
});

initializeDiscordWebhook(DATABUDDY_WEBHOOK_URL, {
    defaultUsername: 'Databuddy',
});
export const logger = {
    info: (title: string, message: string, metadata?: Record<string, unknown>) =>
        dataBuddyWebhook.logInfo(title, message, metadata),
    success: (title: string, message: string, metadata?: Record<string, unknown>) =>
        dataBuddyWebhook.logSuccess(title, message, metadata),
    warning: (title: string, message: string, metadata?: Record<string, unknown>) =>
        dataBuddyWebhook.logWarning(title, message, metadata),
    error: (title: string, message: string, metadata?: Record<string, unknown>) =>
        dataBuddyWebhook.logError(title, message, metadata),
    debug: (title: string, message: string, metadata?: Record<string, unknown>) =>
        dataBuddyWebhook.logDebug(title, message, metadata),
    exception: (error: Error, context?: Record<string, unknown>) =>
        dataBuddyWebhook.logException(error, context),
    activity: (action: string, userId: string, details?: Record<string, unknown>) =>
        dataBuddyWebhook.logUserActivity(action, userId, details),
    notify: (title: string, message: string, level: LogLevel = 'info') =>
        dataBuddyWebhook.sendSystemNotification(title, message, level),
    message: (content: string, options?: Partial<DiscordWebhookMessage>) =>
        dataBuddyWebhook.sendMessage(content, options),
    embed: (embed: DiscordEmbed, options?: Partial<DiscordWebhookMessage>) =>
        dataBuddyWebhook.sendEmbed(embed, options),
};

