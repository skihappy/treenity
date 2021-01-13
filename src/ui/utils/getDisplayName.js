/**
 * Get display name of React component
 * @param Component - component to get name from
 * @return {*|string} - component name or 'Component' if name not set
 */
export default function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}
