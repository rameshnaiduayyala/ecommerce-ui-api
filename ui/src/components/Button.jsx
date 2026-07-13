import { useState } from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', asChild = false, ...props }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    if (props.onClick) {
      setIsLoading(true);
      await Promise.resolve(props.onClick(e));
      setIsLoading(false);
    }
  };

  const baseClasses = 'transition-all duration-200 ease-in-out rounded-lg font-medium';
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:bg-destructive/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  };
  
  const sizeClasses = {
    xs: 'h-6 px-2 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
    ${isLoading ? 'opacity-50 cursor-wait' : ''}
  `;

  const Component = asChild ? props.asChild || 'span' : props.asChild === false ? 'button' : 'button';

  return (
    <Component
      className={classes.trim()}
      onClick={handleClick}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-primary-foreground border-r-transparent rounded-full"></span>
      ) : (
        children
      )}
    </Component>
  );
};

export default Button;