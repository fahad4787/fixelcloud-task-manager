# Task Manager - FixelCloud

A modern, role-based task management application built with React, featuring authentication, drag-and-drop kanban boards, and comprehensive team management.

## 🚀 Features

### Authentication & Role-Based Access Control
- **Three User Roles:**
  - **Super Admin**: Full access to all features
  - **Admin**: Can edit, delete, and manage tasks
  - **User**: Can only move tasks and view content

### Task Management
- Create, edit, and delete tasks
- Drag-and-drop task management
- Priority levels (Low, Medium, High, Urgent)
- Task assignment to team members
- Status tracking (Todo, In Progress, Review, Done)
- Team-based organization (Designer, Developer, BD)

### Dashboard
- Real-time statistics and metrics
- Team performance tracking
- Recent tasks overview
- Role-based quick actions
- Modern, responsive design

### Kanban Board
- Visual task management
- Drag-and-drop functionality
- Filtering by team, priority, and assignee
- Role-based permissions for task operations

## 🔐 Demo Credentials

### Super Admin
- **Email**: superadmin@fixelcloud.com
- **Password**: superadmin123
- **Permissions**: All features

### Admin
- **Email**: admin@fixelcloud.com
- **Password**: admin123
- **Permissions**: Edit, delete, and manage tasks

### User
- **Email**: user@fixelcloud.com
- **Password**: user123
- **Permissions**: Move tasks and view content

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Task-Manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header/         # Navigation header with user menu
│   ├── Sidebar/        # Navigation sidebar
│   ├── TaskCard/       # Individual task display
│   └── ...
├── contexts/           # React contexts for state management
│   ├── AuthContext.jsx # Authentication and role management
│   └── TaskContext.jsx # Task and employee data management
├── pages/              # Main application pages
│   ├── Login/          # Authentication page
│   ├── Dashboard/      # Main dashboard
│   ├── KanbanBoard/    # Task management board
│   └── ...
└── assets/             # Static assets
```

## 🔧 Key Features Implementation

### Authentication System
- Custom authentication context with role-based permissions
- Local storage persistence
- Protected routes
- Login/logout functionality

### Role-Based Access Control
- Permission-based UI rendering
- Conditional feature access
- Secure task operations

### Task Assignment System
- Select role/team first
- Then assign to specific team members
- Visual team indicators
- Assignment tracking

### Responsive Design
- Mobile-friendly interface
- Modern UI with animations
- Bootstrap integration
- Custom SCSS styling

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Animations**: Smooth transitions using Framer Motion
- **Responsive**: Works on all device sizes
- **Accessibility**: Keyboard navigation and screen reader support
- **Dark Mode Ready**: CSS variables for easy theming

## 🔮 Future Enhancements

- Firebase integration for cloud storage
- Real-time collaboration
- File attachments
- Time tracking
- Advanced analytics
- Email notifications
- Mobile app

## 🛡️ Security Features

- Role-based access control
- Protected routes
- Input validation
- Secure authentication flow
- Permission-based operations

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please contact the development team.

---

**Built with ❤️ by FixelCloud Team** 