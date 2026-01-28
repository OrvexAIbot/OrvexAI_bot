import { ReactNode } from 'react';

export interface NavItem {
  label: string;
  path: string;
}

export interface Feature {
  title: string;
  description: string;
  icon?: ReactNode;
}

export enum AlertType {
  WHALE = 'WHALE',
  RISK = 'RISK',
  ALPHA = 'ALPHA',
  PREDICTION = 'PREDICTION',
  SECURITY = 'SECURITY'
}

export interface AlertData {
  id: string;
  type: AlertType;
  title: string;
  timestamp: string;
  details: { label: string; value: string; highlight?: boolean }[];
  footer?: string;
}