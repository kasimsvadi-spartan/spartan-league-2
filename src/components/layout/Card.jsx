export function Card({ children, className = '', style = {} }) {
  return <div className={`ember-card ${className}`} style={style}>{children}</div>
}
