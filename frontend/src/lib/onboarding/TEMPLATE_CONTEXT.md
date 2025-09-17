# Template Context for Onboarding Projects

## Overview
This file provides context for the AI agent when working with onboarding template projects. When a user completes onboarding, a template project is created based on their selected profile with pre-populated files and messages.

## How Templates Work

1. **Profile Selection**: User selects a profile type during onboarding (Designer, Developer, Analyst, etc.)
2. **Template Creation**: System creates a project with:
   - Pre-created files in the sandbox
   - Mock conversation history showing what was "created"
   - Initial assistant message explaining the template
3. **Agent Interaction**: User can then interact with the agent to customize the template

## Important Context for Agent

### When Working with Template Projects

The agent should understand that:

1. **Files Already Exist**: All files mentioned in the initial message are already created in the sandbox
2. **No Need to Recreate**: Don't recreate files that are already mentioned as created
3. **Focus on Customization**: The agent's role is to help customize and extend what's already there
4. **Personalization Questions**: The initial message contains questions to personalize the template
5. **Template Awareness**: Be aware this is a template project meant to be customized

### Template Identification

You can identify a template project by:
- The first message is from the assistant (not user)
- Message contains detailed description of files created
- Message contains personalization questions
- Files already exist in the sandbox matching the description

### How to Handle Template Projects

1. **Acknowledge the Template**: Recognize that files are already created
2. **Answer Personalization Questions**: Focus on getting answers to customize
3. **Modify Existing Files**: Use edit tools rather than creating new files
4. **Extend Functionality**: Add new features based on user requirements
5. **Keep Context**: Remember what template was used and its purpose

## Template Types

### Landing Page (Designer Profile)
- Modern, responsive landing page
- Focus on conversion optimization
- Files: index.html, styles.css, script.js
- Customization: Company name, colors, CTAs, features

### Dashboard Analytics (Data Analyst Profile)
- Interactive dashboard with charts
- KPIs and metrics visualization
- Files: dashboard.html, dashboard.css, charts.js, data.json
- Customization: KPIs, data sources, chart types, periods

### API REST Node.js (Developer Profile)
- Complete REST API with Express
- Authentication and validation
- Files: server.js, routes/, controllers/, middleware/
- Customization: Entities, database, auth method, integrations

### Blog Markdown (Content Creator Profile)
- Blog system with Markdown support
- SEO optimized, reading-focused
- Files: index.html, post.html, styles.css, markdown-parser.js
- Customization: Blog name, categories, style, comments

### E-commerce Cart (E-commerce Profile)
- Full shopping cart system
- Product catalog and checkout
- Files: shop.html, cart.html, product.html, checkout.html
- Customization: Store name, products, payment methods, shipping

### Game 2048 (Gamer Profile)
- Fully functional 2048 game
- Score tracking and animations
- Files: game.html, game.css, game.js
- Customization: Themes, modes, power-ups, multiplayer

## Best Practices

1. **Don't Duplicate Work**: Check if files exist before creating
2. **Use Edit Over Create**: Prefer editing existing files
3. **Maintain Template Structure**: Keep the original organization
4. **Progressive Enhancement**: Add features incrementally
5. **User-Driven Changes**: Wait for user input before major changes

## Example Interaction Flow

```
1. User enters project from onboarding
2. Agent sees template message with files created
3. User answers personalization questions
4. Agent modifies existing files based on answers
5. Agent adds new features as requested
6. Project evolves from template to custom solution
```

## Notes

- Templates are designed to be starting points, not final products
- Each template includes working examples and best practices
- Files are created via the template system, not through tool calls
- The agent should build upon the template, not replace it