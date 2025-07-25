import type { SimpleQueryConfig } from "../types";

export const PerformanceBuilders: Record<string, SimpleQueryConfig> = {
    performance_metrics: {
        table: 'analytics.events',
        fields: [
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as total_events'
        ],
        where: ['event_name = \'screen_view\''],
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name', 'country'],
        customizable: true
    },

    slow_pages: {
        table: 'analytics.events',
        fields: [
            'path(path) as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as pageviews'
        ],
        where: ['event_name = \'screen_view\'', 'path != \'\'', 'load_time > 0'],
        groupBy: ['path(path)'],
        orderBy: 'avg_load_time DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_device: {
        table: 'analytics.events',
        fields: [
            'device_type as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as pageviews'
        ],
        where: ['event_name = \'screen_view\'', 'device_type != \'\'', 'load_time > 0'],
        groupBy: ['device_type'],
        orderBy: 'avg_load_time DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_browser: {
        table: 'analytics.events',
        fields: [
            'CONCAT(browser_name, \' \', browser_version) as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as pageviews'
        ],
        where: [
            'event_name = \'screen_view\'',
            'browser_name != \'\'',
            'browser_version != \'\'',
            'browser_version IS NOT NULL',
            'load_time > 0'
        ],
        groupBy: ['browser_name', 'browser_version'],
        orderBy: 'avg_load_time DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_country: {
        table: 'analytics.events',
        fields: [
            'country as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as pageviews'
        ],
        where: ['event_name = \'screen_view\'', 'country != \'\'', 'load_time > 0'],
        groupBy: ['country'],
        orderBy: 'avg_load_time DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true,
        plugins: { normalizeGeo: true, deduplicateGeo: true }
    },

    performance_by_os: {
        table: 'analytics.events',
        fields: [
            'os_name as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as pageviews'
        ],
        where: ['event_name = \'screen_view\'', 'os_name != \'\'', 'load_time > 0'],
        groupBy: ['os_name'],
        orderBy: 'avg_load_time DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_by_region: {
        table: 'analytics.events',
        fields: [
            'CONCAT(region, \', \', country) as name',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as pageviews'
        ],
        where: ['event_name = \'screen_view\'', 'region != \'\'', 'load_time > 0'],
        groupBy: ['region', 'country'],
        orderBy: 'avg_load_time DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    },

    performance_time_series: {
        table: 'analytics.events',
        fields: [
            'toDate(time) as date',
            'AVG(CASE WHEN load_time > 0 THEN load_time ELSE NULL END) as avg_load_time',
            'AVG(CASE WHEN ttfb > 0 THEN ttfb ELSE NULL END) as avg_ttfb',
            'AVG(CASE WHEN dom_ready_time > 0 THEN dom_ready_time ELSE NULL END) as avg_dom_ready_time',
            'AVG(CASE WHEN render_time > 0 THEN render_time ELSE NULL END) as avg_render_time',
            'AVG(CASE WHEN fcp > 0 THEN fcp ELSE NULL END) as avg_fcp',
            'AVG(CASE WHEN lcp > 0 THEN lcp ELSE NULL END) as avg_lcp',
            'AVG(CASE WHEN cls >= 0 THEN cls ELSE NULL END) as avg_cls',
            'COUNT(*) as pageviews'
        ],
        where: ['event_name = \'screen_view\''],
        groupBy: ['toDate(time)'],
        orderBy: 'date ASC',
        timeField: 'time',
        allowedFilters: ['path', 'device_type', 'browser_name'],
        customizable: true
    }
}; 