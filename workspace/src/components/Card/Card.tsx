import { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card = ({ title, children, className = '', onClick }: CardProps) => {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;