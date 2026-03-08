import { CheckoutField } from '@/hooks/useCheckoutFields';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Props {
  fields: CheckoutField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

export default function DynamicCheckoutFields({ fields, values, onChange }: Props) {
  if (!fields.length) return null;

  return (
    <div className="bg-card rounded-xl shadow-card border p-6">
      <h3 className="font-heading font-semibold text-foreground mb-4">Additional Information</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className={field.field_type === 'textarea' ? 'sm:col-span-2' : ''}>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {renderField(field, values[field.id] || '', (v) => onChange(field.id, v))}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderField(field: CheckoutField, value: string, onChange: (v: string) => void) {
  switch (field.field_type) {
    case 'number':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          min={0}
        />
      );
    case 'date':
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      );
    case 'select':
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt: any) => {
              const label = typeof opt === 'string' ? opt : opt.label;
              const val = typeof opt === 'string' ? opt : opt.value || opt.label;
              return (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );
    case 'textarea':
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          rows={3}
        />
      );
    case 'location':
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'Enter location...'}
        />
      );
    default:
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
        />
      );
  }
}
