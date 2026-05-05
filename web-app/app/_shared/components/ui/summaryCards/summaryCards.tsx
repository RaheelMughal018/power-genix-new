'use client';

import React from 'react';
import Link from 'next/link';
import styles from './summaryCards.module.scss';

interface SummaryCard {
  label: string;
  value: string | number;
  href?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
}

interface SummaryCardsProps {
  cards: SummaryCard[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const CardContent = ({ card }: { card: SummaryCard }) => (
  <>
    <div className={styles.card__header}>
      <span className={styles.card__label}>{card.label}</span>
      {card.icon && <span className={styles.card__icon}>{card.icon}</span>}
    </div>
    <div className={styles.card__value}>{card.value}</div>
    {card.trend && (
      <div
        className={[
          styles.card__trend,
          card.trend.positive ? styles['card__trend--positive'] : styles['card__trend--negative'],
        ].join(' ')}
      >
        <span className={styles.card__trendArrow}>{card.trend.positive ? '↑' : '↓'}</span>
        {card.trend.value}
      </div>
    )}
  </>
);

export const SummaryCards = ({ cards, columns = 4, className = '' }: SummaryCardsProps) => {
  const gridClass = [
    styles.grid,
    styles[`grid--cols-${columns}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={gridClass}>
      {cards.map((card, index) =>
        card.href ? (
          <Link key={index} href={card.href} className={[styles.card, styles['card--clickable']].join(' ')}>
            <CardContent card={card} />
          </Link>
        ) : (
          <div key={index} className={styles.card}>
            <CardContent card={card} />
          </div>
        )
      )}
    </div>
  );
};
