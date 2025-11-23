import { Users, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from 'shared-lib';
import { PageHeader, StatCard, DataCard, ProgressBar } from 'shared-lib';
import { useTranslation } from 'react-i18next';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'shared-lib';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { DrillDownChart } from 'shared-lib';
import {useCallback, useEffect, useState} from "react";
import { useModuleLifecycle } from "../useModuleLifecycle.ts";

// ------- Static Data (unchanged) ------- //

const recentActivity = [
    { id: 1, title: 'Workflow #1 executed', time: '2 hours ago' },
    { id: 2, title: 'Workflow #2 executed', time: '3 hours ago' },
    { id: 3, title: 'Workflow #3 executed', time: '5 hours ago' },
    { id: 4, title: 'Workflow #4 executed', time: '8 hours ago' },
];

const messageVolume = [
    { label: 'SMS', value: 5432, maxValue: 8000, color: 'bg-primary' },
    { label: 'Email', value: 3210, maxValue: 8000, color: 'bg-secondary' },
    { label: 'App', value: 300, maxValue: 8000, color: 'bg-primary' },
];

const chartData = [
    { date: 'Mon', sms: 850, email: 520, app: 45 },
    { date: 'Tue', sms: 920, email: 480, app: 52 },
    { date: 'Wed', sms: 780, email: 610, app: 38 },
    { date: 'Thu', sms: 1100, email: 550, app: 65 },
    { date: 'Fri', sms: 950, email: 490, app: 48 },
    { date: 'Sat', sms: 620, email: 380, app: 30 },
    { date: 'Sun', sms: 710, email: 420, app: 42 },
];

const chartConfig = {
    sms: { label: 'SMS', color: 'hsl(var(--primary))' },
    email: { label: 'Email', color: 'hsl(var(--secondary))' },
    app: { label: 'App', color: 'hsl(var(--accent))' },
};


// ---------- MAIN COMPONENT (MERGED + IMPROVED) ---------- //

export default function DashboardPage() {
    const { emit, on } = useModuleLifecycle('dashboard');
    const { t } = useTranslation();

    // ---------------------------------------------
    // STATE: Stats & Filters (Loveable improvement)
    // ---------------------------------------------
    const [filters, setFilters] = useState({ dateRange: 'week' });

    const [stats, setStats] = useState([
        { title: t('dashboard.totalContacts'), value: '12,345', change: '+12% from last month', icon: Users, color: 'text-primary', key: 'contacts' },
        { title: t('dashboard.messagesSent'), value: '8,942', change: '+23% from last month', icon: MessageSquare, color: 'text-secondary', key: 'messagesSent' },
        { title: t('dashboard.activeWorkflows'), value: '24', change: '+8% from last month', icon: Activity, color: 'text-primary', key: 'workflows' },
        { title: t('dashboard.deliveryRate'), value: '68%', change: '+5% from last month', icon: TrendingUp, color: 'text-secondary', key: 'deliveryRate' },
    ]);

    // ---------------------------------------------
    // LISTEN TO EVENTS FROM OTHER MFEs
    // ---------------------------------------------
    useEffect(() => {
        const offContactAdded = on('contact:added', (data) => {
            console.log('Dashboard: contact added', data);
            setStats(prev =>
                prev.map(s =>
                    s.key === 'contacts'
                        ? { ...s, value: String(Number(s.value.replace(/,/g, '')) + 1) }
                        : s
                )
            );
        });

        const offMessageSent = on('message:sent', (data) => {
            console.log('Dashboard: message sent', data);
            setStats(prev =>
                prev.map(s =>
                    s.key === 'messagesSent'
                        ? { ...s, value: String(Number(s.value.replace(/,/g, '')) + 1) }
                        : s
                )
            );
        });

        // Existing: data:updated listener (kept)
        const offDataUpdated = on('data:updated', (data) => {
            console.log('Dashboard received data update:', data);
        });

        return () => {
            offContactAdded?.();
            offMessageSent?.();
            offDataUpdated?.();
        };
    }, [on]);


    // -----------------------------------------------------
    // HANDLER: Date Range Change (notifies Reports MFE)
    // -----------------------------------------------------
    const handleDateRangeChange = (newRange: string) => {
        setFilters({ dateRange: newRange });

        emit('dashboard:filter:changed', {
            type: 'dateRange',
            value: newRange,
        });
    };


    // -----------------------------------------------------
    // HANDLER: When stat card is clicked
    // -----------------------------------------------------


    const handleStatClick = useCallback((key: string) => {
        emit("dashboard:stat:clicked", {
            type: key,
            timestamp: Date.now(),
        });
    }, [emit]);




    // -----------------------------------------------------
    // HANDLER: Refresh Dashboard Data
    // -----------------------------------------------------
    const handleRefreshData = async () => {
        // Simulate API call
        await new Promise(res => setTimeout(res, 300));

        emit('dashboard:data:refreshed', {
            timestamp: Date.now(),
        });

        console.log("Dashboard refreshed");
    };


    // ----------------- RENDER UI ----------------- //

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Top Header */}
            <PageHeader
                title={t('dashboard.title')}
                description={t('dashboard.subtitle')}
            />

            {/* Filter Example */}
            <div className="flex gap-2">
                <select
                    value={filters.dateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value)}
                    className="glass-card border-glass-border px-3 py-2 rounded-md"
                >
                    <option value="week">{t("dashboard.lastWeek")}</option>
                    <option value="month">{t("dashboard.lastMonth")}</option>
                </select>

                <button
                    onClick={handleRefreshData}
                    className="glass-card border-glass-border px-3 py-2 rounded-md"
                >
                    {t("dashboard.refresh")}
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ key, ...rest }) => (
                    <button
                        key={key}
                        onClick={() => handleStatClick(key)}
                        className="text-left w-full"
                    >
                        <StatCard {...rest} />
                    </button>
                ))}
            </div>

            {/* Activity + Message Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-glass-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">{t('dashboard.recentActivity')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentActivity.map((activity) => (
                            <DataCard
                                key={activity.id}
                                icon={MessageSquare}
                                title={activity.title}
                                subtitle={activity.time}
                            />
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass-card border-glass-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">{t('dashboard.messageVolume')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {messageVolume.map((channel) => (
                                <ProgressBar
                                    key={channel.label}
                                    label={channel.label}
                                    value={channel.value}
                                    maxValue={channel.maxValue}
                                    color={channel.color}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Trends Chart */}
            <Card className="glass-card border-glass-border">
                <CardHeader>
                    <CardTitle className="text-foreground">{t('dashboard.weeklyTrends')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="fillSms" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                </linearGradient>

                                <linearGradient id="fillEmail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1} />
                                </linearGradient>

                                <linearGradient id="fillApp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                className="text-xs text-muted-foreground"
                            />

                            <ChartTooltip content={<ChartTooltipContent />} />

                            <Area type="monotone" dataKey="sms" stroke="hsl(var(--primary))" fill="url(#fillSms)" stackId="1" />
                            <Area type="monotone" dataKey="email" stroke="hsl(var(--secondary))" fill="url(#fillEmail)" stackId="1" />
                            <Area type="monotone" dataKey="app" stroke="hsl(var(--accent))" fill="url(#fillApp)" stackId="1" />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Drill Down Chart */}
            <DrillDownChart />
        </div>
    );
}
