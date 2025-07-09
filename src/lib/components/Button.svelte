<script lang="ts">
  import Icon from './Icon.svelte';
  
  export let variant: 'primary' | 'secondary' | 'destructive' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  export let unstyled = false;

  // Base classes for each variant
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-400 hover:text-gray-600 focus:ring-gray-500'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Combine classes
  $: buttonClasses = unstyled
    ? ($$restProps.class || '')
    : [
        'inline-flex items-center justify-center font-medium rounded-md',
        'focus:ring-2 focus:ring-offset-2 focus:outline-none',
        'transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        $$restProps.class || ''
      ].filter(Boolean).join(' ');
</script>

<button
  type={type}
  disabled={disabled || loading}
  class={buttonClasses}
  {...$$restProps}
  on:click
  on:keydown
  on:focus
  on:blur
  on:mouseenter
  on:mouseleave
  on:submit
  on:reset
>
  {#if loading}
    <Icon
      icon="lucide:loader-2"
      size="w-4 h-4"
      className="animate-spin -ml-1 mr-2"
      ariaHidden={true}
    />
  {/if}
  <slot />
</button> 