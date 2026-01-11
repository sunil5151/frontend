# Reusable Components

This folder contains reusable React components styled with Tailwind CSS for the Smart Task Planner application.

## Components

### 1. Button
Versatile button component with multiple variants and sizes.

**Usage:**
```jsx
import { Button } from '../components';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `type`: 'button' | 'submit' | 'reset'
- `disabled`: boolean
- `onClick`: function

---

### 2. Card
Card container component with subcomponents for structured content.

**Usage:**
```jsx
import { Card } from '../components';

<Card hover>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description</Card.Description>
  </Card.Header>
  <Card.Content>
    Main content here
  </Card.Content>
  <Card.Footer>
    Footer content
  </Card.Footer>
</Card>
```

**Props:**
- `hover`: boolean - Adds hover effect
- `onClick`: function
- `className`: string

---

### 3. Input
Styled input field with label and error handling.

**Usage:**
```jsx
import { Input } from '../components';

<Input
  label="Email Address"
  id="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="you@example.com"
  required
  error={emailError}
/>
```

**Props:**
- `label`: string
- `id`: string
- `type`: string (default: 'text')
- `value`: string
- `onChange`: function
- `placeholder`: string
- `required`: boolean
- `error`: string - Error message to display

---

### 4. Textarea
Styled textarea with label and error handling.

**Usage:**
```jsx
import { Textarea } from '../components';

<Textarea
  label="Description"
  id="description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={4}
  required
/>
```

**Props:**
- `label`: string
- `id`: string
- `value`: string
- `onChange`: function
- `placeholder`: string
- `rows`: number (default: 4)
- `required`: boolean
- `error`: string

---

### 5. Spinner
Loading spinner component.

**Usage:**
```jsx
import { Spinner } from '../components';

<Spinner size="md" color="primary" />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `color`: 'primary' | 'secondary' | 'white' | 'gray'

---

### 6. Badge
Badge component for status indicators.

**Usage:**
```jsx
import { Badge } from '../components';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

**Props:**
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
- `className`: string

---

### 7. Alert
Alert component for displaying messages.

**Usage:**
```jsx
import { Alert } from '../components';

<Alert 
  type="success" 
  message="Goal created successfully!" 
  onClose={() => setAlert(null)}
/>
```

**Props:**
- `type`: 'success' | 'error' | 'warning' | 'info'
- `message`: string
- `onClose`: function (optional) - Shows close button if provided
- `className`: string

---

### 8. Modal
Modal dialog component.

**Usage:**
```jsx
import { Modal } from '../components';

<Modal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={handleConfirm}>Confirm</Button>
    <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
  </div>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `children`: ReactNode

---

## Import Methods

### Individual Import
```jsx
import Button from './components/Button';
import Card from './components/Card';
```

### Batch Import
```jsx
import { Button, Card, Input, Alert } from './components';
```

---

## Customization

All components accept a `className` prop for additional Tailwind CSS classes:

```jsx
<Button className="mt-4 w-full">Full Width Button</Button>
<Card className="border-2 border-primary">Custom Card</Card>
```

---

## Color Theme

The components use the color palette defined in `tailwind.config.js`:

- **Primary**: Blue (#3b82f6)
- **Secondary**: Purple (#8b5cf6)
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Danger**: Red (#ef4444)

---

## Examples

### Form with Components
```jsx
import { Input, Textarea, Button, Alert } from '../components';

function MyForm() {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error" message={error} />}
      
      <Input
        label="Name"
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <Textarea
        label="Description"
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={4}
      />
      
      <Button type="submit" variant="primary">
        Submit
      </Button>
    </form>
  );
}
```

### Card List
```jsx
import { Card, Badge, Button } from '../components';

function CardList({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} hover>
          <Card.Header>
            <div className="flex justify-between items-start">
              <Card.Title>{item.title}</Card.Title>
              <Badge variant={item.status === 'active' ? 'success' : 'default'}>
                {item.status}
              </Badge>
            </div>
          </Card.Header>
          <Card.Content>
            <p>{item.description}</p>
          </Card.Content>
          <Card.Footer>
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </Card.Footer>
        </Card>
      ))}
    </div>
  );
}
```

---

These components provide a consistent, reusable foundation for the Smart Task Planner UI.
