// ============================================================
// templates.ts — Pre-designed starter templates
// Give the project an authentic, handcrafted feel
// ============================================================
import { nanoid } from 'nanoid';
import type { Document, AnyNode, TextNode } from './types';

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  create: () => Document;
}

export function createMobileAppTemplate(): Document {
  const pageId = nanoid();
  const frameId = nanoid();
  const titleId = nanoid();
  const subId = nanoid();
  const inputEmailId = nanoid();
  const inputPassId = nanoid();
  const btnId = nanoid();
  const btnTextId = nanoid();
  const avatarId = nanoid();

  const frame: AnyNode = {
    id: frameId,
    type: 'frame',
    name: 'Mobile Screen (iPhone 15)',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 120, y: 80, width: 390, height: 750, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#0F172A', opacity: 1 },
    stroke: { color: '#334155', width: 2, opacity: 1 },
    shadow: { x: 0, y: 20, blur: 40, spread: 0, color: '#000000', opacity: 0.4, enabled: true },
    cornerRadius: 32,
    children: [],
  };

  const avatar: AnyNode = {
    id: avatarId,
    type: 'ellipse',
    name: 'App Icon Badge',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 265, y: 160, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#6366F1', opacity: 1 },
    stroke: { color: '#818CF8', width: 4, opacity: 1 },
    shadow: { x: 0, y: 10, blur: 20, spread: 0, color: '#6366F1', opacity: 0.35, enabled: true },
    cornerRadius: 0,
  };

  const title: TextNode = {
    id: titleId,
    type: 'text',
    name: 'Welcome Header',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 290, width: 310, height: 40, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    content: 'Welcome back!',
    fontSize: 28,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    textAlign: 'center',
    color: '#F8FAFC',
  };

  const subtitle: TextNode = {
    id: subId,
    type: 'text',
    name: 'Subtitle',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 340, width: 310, height: 30, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    content: 'Enter your credentials to continue',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400',
    textAlign: 'center',
    color: '#94A3B8',
  };

  const inputEmail: AnyNode = {
    id: inputEmailId,
    type: 'rectangle',
    name: 'Email Input Field',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 400, width: 310, height: 52, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#1E293B', opacity: 1 },
    stroke: { color: '#334155', width: 1.5, opacity: 1 },
    shadow: { x: 0, y: 2, blur: 6, spread: 0, color: '#000', opacity: 0.2, enabled: true },
    cornerRadius: 12,
  };

  const inputPass: AnyNode = {
    id: inputPassId,
    type: 'rectangle',
    name: 'Password Input Field',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 470, width: 310, height: 52, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#1E293B', opacity: 1 },
    stroke: { color: '#334155', width: 1.5, opacity: 1 },
    shadow: { x: 0, y: 2, blur: 6, spread: 0, color: '#000', opacity: 0.2, enabled: true },
    cornerRadius: 12,
  };

  const btn: AnyNode = {
    id: btnId,
    type: 'rectangle',
    name: 'Primary Button',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 555, width: 310, height: 54, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#4F46E5', opacity: 1 },
    stroke: { color: '#6366F1', width: 1, opacity: 1 },
    shadow: { x: 0, y: 8, blur: 20, spread: 0, color: '#4F46E5', opacity: 0.45, enabled: true },
    cornerRadius: 14,
  };

  const btnText: TextNode = {
    id: btnTextId,
    type: 'text',
    name: 'Button Text',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 160, y: 570, width: 310, height: 30, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    content: 'Sign In →',
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  };

  const page: AnyNode = {
    id: pageId,
    type: 'page',
    name: 'Mobile Design',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 0, height: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#0B0F19', opacity: 1 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    children: [frameId, avatarId, titleId, subId, inputEmailId, inputPassId, btnId, btnTextId],
  };

  return {
    id: nanoid(),
    name: 'Mobile App Sign-In',
    pages: [pageId],
    activePageId: pageId,
    nodes: {
      [pageId]: page,
      [frameId]: frame,
      [avatarId]: avatar,
      [titleId]: title,
      [subId]: subtitle,
      [inputEmailId]: inputEmail,
      [inputPassId]: inputPass,
      [btnId]: btn,
      [btnTextId]: btnText,
    },
  };
}

export function createAnalyticsDashboardTemplate(): Document {
  const pageId = nanoid();
  const fId = nanoid();
  const card1Id = nanoid();
  const card2Id = nanoid();
  const card3Id = nanoid();
  const titleId = nanoid();
  const stat1Title = nanoid();
  const stat1Val = nanoid();
  const stat2Title = nanoid();
  const stat2Val = nanoid();
  const stat3Title = nanoid();
  const stat3Val = nanoid();
  const chartBar1 = nanoid();
  const chartBar2 = nanoid();
  const chartBar3 = nanoid();
  const chartBar4 = nanoid();

  const frame: AnyNode = {
    id: fId,
    type: 'frame',
    name: 'Analytics Dashboard',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 80, y: 60, width: 880, height: 560, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#111827', opacity: 1 },
    stroke: { color: '#1F2937', width: 2, opacity: 1 },
    shadow: { x: 0, y: 25, blur: 50, spread: 0, color: '#000000', opacity: 0.5, enabled: true },
    cornerRadius: 24,
  };

  const title: TextNode = {
    id: titleId,
    type: 'text',
    name: 'Dashboard Header',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 120, y: 100, width: 400, height: 40, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    content: 'Overview & Performance Metrics',
    fontSize: 22,
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    textAlign: 'left',
    color: '#F9FAFB',
  };

  // 3 Metric Cards
  const makeCard = (id: string, x: number, color: string): AnyNode => ({
    id,
    type: 'rectangle',
    name: 'Stat Card',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x, y: 160, width: 240, height: 130, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#1F2937', opacity: 1 },
    stroke: { color, width: 1.5, opacity: 0.6 },
    shadow: { x: 0, y: 8, blur: 16, spread: 0, color: '#000', opacity: 0.25, enabled: true },
    cornerRadius: 16,
  });

  const card1 = makeCard(card1Id, 120, '#3B82F6');
  const card2 = makeCard(card2Id, 400, '#10B981');
  const card3 = makeCard(card3Id, 680, '#F59E0B');

  const makeStatText = (id: string, x: number, y: number, content: string, size: number, weight: string, color: string): TextNode => ({
    id,
    type: 'text',
    name: 'Stat Label',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x, y, width: 220, height: 30, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    content,
    fontSize: size,
    fontFamily: 'Inter, sans-serif',
    fontWeight: weight,
    textAlign: 'left',
    color,
  });

  const t1 = makeStatText(stat1Title, 140, 180, 'TOTAL REVENUE', 12, '600', '#9CA3AF');
  const v1 = makeStatText(stat1Val, 140, 210, '$142,850', 26, '700', '#60A5FA');

  const t2 = makeStatText(stat2Title, 420, 180, 'ACTIVE USERS', 12, '600', '#9CA3AF');
  const v2 = makeStatText(stat2Val, 420, 210, '24,592', 26, '700', '#34D399');

  const t3 = makeStatText(stat3Title, 700, 180, 'CONVERSION RATE', 12, '600', '#9CA3AF');
  const v3 = makeStatText(stat3Val, 700, 210, '4.82%', 26, '700', '#FBBF24');

  // Chart representation
  const b1: AnyNode = {
    id: chartBar1,
    type: 'rectangle',
    name: 'Chart Bar Q1',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 180, y: 390, width: 80, height: 160, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#3B82F6', opacity: 1 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 4, blur: 12, spread: 0, color: '#3B82F6', opacity: 0.3, enabled: true },
    cornerRadius: 8,
  };
  const b2: AnyNode = {
    id: chartBar2,
    type: 'rectangle',
    name: 'Chart Bar Q2',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 340, y: 340, width: 80, height: 210, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#6366F1', opacity: 1 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 4, blur: 12, spread: 0, color: '#6366F1', opacity: 0.3, enabled: true },
    cornerRadius: 8,
  };
  const b3: AnyNode = {
    id: chartBar3,
    type: 'rectangle',
    name: 'Chart Bar Q3',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 500, y: 310, width: 80, height: 240, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#EC4899', opacity: 1 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 4, blur: 12, spread: 0, color: '#EC4899', opacity: 0.3, enabled: true },
    cornerRadius: 8,
  };
  const b4: AnyNode = {
    id: chartBar4,
    type: 'rectangle',
    name: 'Chart Bar Q4',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 660, y: 360, width: 80, height: 190, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#10B981', opacity: 1 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 4, blur: 12, spread: 0, color: '#10B981', opacity: 0.3, enabled: true },
    cornerRadius: 8,
  };

  const children = [
    fId, titleId,
    card1Id, card2Id, card3Id,
    stat1Title, stat1Val, stat2Title, stat2Val, stat3Title, stat3Val,
    chartBar1, chartBar2, chartBar3, chartBar4,
  ];

  const page: AnyNode = {
    id: pageId,
    type: 'page',
    name: 'Dashboard Page',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 0, height: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#090D16', opacity: 1 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    children,
  };

  return {
    id: nanoid(),
    name: 'Analytics Dashboard',
    pages: [pageId],
    activePageId: pageId,
    nodes: {
      [pageId]: page,
      [fId]: frame,
      [titleId]: title,
      [card1Id]: card1, [card2Id]: card2, [card3Id]: card3,
      [stat1Title]: t1, [stat1Val]: v1,
      [stat2Title]: t2, [stat2Val]: v2,
      [stat3Title]: t3, [stat3Val]: v3,
      [chartBar1]: b1, [chartBar2]: b2, [chartBar3]: b3, [chartBar4]: b4,
    },
  };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'mobile',
    name: 'Mobile Sign-In',
    description: 'Clean dark mobile UI with rounded inputs, glowing CTA, and typography',
    icon: '📱',
    create: createMobileAppTemplate,
  },
  {
    id: 'dashboard',
    name: 'SaaS Analytics',
    description: 'Dashboard with metric summary cards, KPI indicators, and bar chart',
    icon: '📊',
    create: createAnalyticsDashboardTemplate,
  },
];
