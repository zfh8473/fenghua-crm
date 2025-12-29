/**
 * Role Selector Component
 * 
 * Provides role selection with radio buttons and color-coded options
 * All custom code is proprietary and not open source.
 */

import { ROLE_DESCRIPTIONS, UserRole, getRoleDescription } from '../role-descriptions';

interface RoleSelectorProps {
  value?: UserRole | string;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

// Role color mapping - matches UserList colors
const getRoleColorClasses = (role: string): string => {
  const colorMap: Record<string, string> = {
    ADMIN: 'bg-primary-blue text-white border-primary-blue',
    DIRECTOR: 'bg-primary-purple text-white border-primary-purple',
    FRONTEND_SPECIALIST: 'bg-primary-green text-white border-primary-green',
    BACKEND_SPECIALIST: 'bg-primary-red text-white border-primary-red',
  };
  return colorMap[role] || 'bg-gray-100 text-gray-600 border-gray-300';
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  required = false,
}) => {
  const handleChange = (role: UserRole) => {
    if (!disabled) {
      onChange(role);
    }
  };

  const selectedRole = value ? getRoleDescription(value) : null;

  return (
    <div className="flex flex-col gap-monday-4">
      {/* Radio Button Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-3">
        {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => {
          const isSelected = value === role;
          const colorClasses = getRoleColorClasses(role);
          const bgColor = colorClasses.split(' ')[0]; // Extract background color
          
          return (
            <label
              key={role}
              className={`
                relative flex items-center gap-monday-3 p-monday-4 rounded-monday-md border-2 cursor-pointer transition-all
                ${isSelected ? `${colorClasses} shadow-monday-md scale-[1.02]` : 'bg-monday-surface border-gray-200 hover:border-gray-300 hover:bg-monday-bg'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={isSelected}
                onChange={() => handleChange(role as UserRole)}
                disabled={disabled}
                required={required}
                className="sr-only"
              />
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${isSelected ? 'border-white bg-white' : 'border-gray-300 bg-white'}
              `}>
                {isSelected && (
                  <div className={`w-3 h-3 rounded-full ${bgColor}`} />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-monday-base font-semibold ${isSelected ? 'text-white' : 'text-monday-text'}`}>
                  {desc.name}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-monday-sm text-primary-red" role="alert">
          {error}
        </p>
      )}

      {/* Role Description */}
      {selectedRole && (
        <div className="mt-monday-2 p-monday-4 bg-blue-50 border border-blue-200 rounded-monday-md" role="note">
          <div className="text-monday-sm font-semibold text-monday-text mb-monday-2">
            {selectedRole.name} - 权限范围
          </div>
          <ul className="list-disc list-inside space-y-monday-1 text-monday-sm text-monday-text-secondary">
            {selectedRole.permissions.map((permission, index) => (
              <li key={index}>{permission}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

