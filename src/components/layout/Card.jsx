export function Card({ children, className = '', style = {}, ...rest }) {
  return <div className={`ember-card ${className}`} style={style} {...rest}>{children}</div>
}
