# InscribeMate Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from accessibility-first platforms like Notion and Linear, combined with modern dark-theme applications. The design prioritizes utility and accessibility while maintaining visual appeal.

## Core Design Elements

### Color Palette
**Dark Mode Primary** (default):
- Background: 0 0% 6% (near-black)
- Surface: 0 0% 12% (dark gray)
- Text Primary: 0 0% 95% (near-white)
- Text Secondary: 0 0% 70% (muted gray)
- Brand Primary: 120 100% 40% (vibrant green)
- Brand Secondary: 120 60% 30% (darker green)
- Success: 142 76% 36%
- Warning: 45 93% 47%
- Error: 0 84% 60%

**Contrast Modes**:
- Low: Reduced contrast with softer grays
- Medium: Standard contrast (above)
- High: Maximum contrast with pure black/white

### Typography
- Primary: Inter (Google Fonts) - Clean, accessible
- Headings: 700 weight, sizes 2xl-4xl
- Body: 400/500 weight, base/lg sizes
- UI Elements: 500 weight, sm/base sizes
- Focus on high contrast ratios for accessibility

### Layout System
**Spacing Units**: Consistent use of Tailwind units 2, 4, 8, 12, 16
- Micro spacing: p-2, m-2
- Component spacing: p-4, gap-4
- Section spacing: py-8, my-12
- Large breaks: py-16

### Component Library

**Navigation**:
- Fixed sidebar with high contrast icons
- Three contrast mode toggle (subtle icons)
- Language selector with Indian flag icons
- Role-based navigation items

**Core UI Elements**:
- Buttons: Solid green primary, outline secondary with blur backgrounds
- Cards: Elevated surfaces with subtle borders
- Forms: High contrast inputs with clear labels
- Status indicators: Color-coded with text labels

**Accessibility Features**:
- Large touch targets (min 44px)
- Clear focus indicators with green outlines
- Screen reader friendly labels
- Skip navigation links

**Dashboard Components**:
- Quick action cards with large, clear CTAs
- Real-time status indicators
- Progress bars with high contrast
- Notification badges with clear typography

### Key Interface Elements

**Blind User Dashboard**:
- Prominent "Request Scribe" button (green, large)
- Simple card-based layout for history
- Voice-first interaction hints

**Volunteer Dashboard**:
- Incoming requests feed with clear priority
- Availability toggle (prominent switch)
- Match acceptance cards with user context

**Admin Interface**:
- Data tables with clear hierarchies
- Metric cards with accessible charts
- User management with role indicators

### Accessibility Specifications
- WCAG 2.1 AA compliance minimum
- Keyboard navigation throughout
- Screen reader optimized markup
- High contrast mode support
- Reduced motion preferences respected
- TTS integration ready styling

### Animations
Minimal and purposeful only:
- Subtle fade transitions for content changes
- Loading states with accessible indicators
- No decorative animations that could distract from core functionality

This design system prioritizes functionality and accessibility while maintaining a modern, professional appearance that builds trust for this critical accessibility service.