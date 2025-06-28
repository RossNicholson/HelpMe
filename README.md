![HelpMe Logo](images/helpmelogo.png)

# HelpMe - The Premier On-Premise Helpdesk for IT Managed Service Providers

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20Development-orange?style=flat&logo=buymeacoffee)](https://buymeacoffee.com/rossnicholson)

## 🎯 Why Choose HelpMe?

**HelpMe is the best choice for Managed Service Providers (MSPs) who demand full control, privacy, and security.**

- **On-Premise & Private Cloud**: Unlike SaaS solutions, HelpMe is designed to run on your own infrastructure—on-premises or in your private cloud. Your data never leaves your environment, giving you complete control and peace of mind.
- **No Reliance on Third-Party SaaS**: Avoid the risks of vendor lock-in, data breaches, and compliance headaches. HelpMe puts you in charge of your helpdesk and your clients' sensitive information.
- **Built for ITIL Best Practices**: Every workflow, process, and feature in HelpMe is designed to align with ITIL (Information Technology Infrastructure Library) best practices, ensuring your MSP operates at the highest standard of service management.

## 🏆 Overview

HelpMe is a modern, open-source helpdesk ticket system specifically designed for IT Managed Service Providers (MSPs). Built with scalability, security, and ease of use in mind, it provides comprehensive ticket management, client communication, and reporting capabilities—all while giving you full control over your data and compliance.

## ☕ Support the Project

If you find HelpMe useful, please consider supporting its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20Development-orange?style=for-the-badge&logo=buymeacoffee)](https://buymeacoffee.com/rossnicholson)

Your support helps keep HelpMe free and open source! 🌟

## 🚀 Professional Services

Need help setting up HelpMe or want custom features? I offer professional services:

- **HelpMe Setup & Configuration** - Get your helpdesk running quickly
- **Custom Development** - Build features specific to your workflow
- **Integration Services** - Connect with your existing tools

**Contact**: helpme@rossnicholson.dev | [rossnicholson.dev](https://rossnicholson.dev)

## ✨ Features

### Core Functionality
- **ITIL-Aligned Ticket Management** - Create, track, and resolve support tickets with workflows that follow ITIL best practices
- **Multi-tenant Architecture** - Support for multiple clients and organizations
- **Priority & SLA Management** - Configurable priority levels and service level agreements, fully ITIL-compliant
- **Asset Management** - Track client devices, software, and infrastructure
- **Knowledge Base** - Centralized documentation and solutions database
- **Time Tracking** - Built-in time tracking for billing and productivity
- **Reporting & Analytics** - Comprehensive reporting dashboard

### MSP-Specific Features
- **Client Portal** - Self-service portal for clients to submit and track tickets
- **Automated Notifications** - Email and SMS notifications for ticket updates
- **Integration Ready** - APIs for third-party integrations (PSA, RMM, etc.)
- **Multi-location Support** - Manage multiple client locations
- **Contract Management** - Track service agreements and billing
- **Escalation Rules** - Automated ticket escalation based on SLA

### Security & Deployment
- **On-Premise or Private Cloud** - Deploy HelpMe on your own servers or private cloud for maximum security and compliance
- **No SaaS Dependency** - Your data, your rules—no third-party SaaS risk
- **Role-based Access Control** - Granular permissions system
- **Audit Logging** - Complete audit trail for compliance

### Technical Features
- **Modern Tech Stack** - React, Node.js, TypeScript, PostgreSQL
- **Real-time Updates** - WebSocket support for live notifications
- **Mobile Responsive** - Works seamlessly on desktop and mobile
- **API-First Design** - RESTful API for easy integrations

### 🆕 Latest Features (v2.0)

#### Enhanced Search & Filtering
- **Global Search** - Search across tickets, clients, users, and assets with real-time results
- **Advanced Filters** - Filter by status, priority, client, date ranges, and custom criteria
- **Smart Results** - Intelligent search with highlighting and result summaries
- **Saved Searches** - Save and reuse common search queries

#### ITIL-Compliant Customer Management
- **Primary Contacts** - Designate primary contact users for each customer with full contact details
- **Customer Users** - Manage multiple users within each customer organization
- **Role-based Permissions** - Granular permissions for customer users (primary contact, secondary contact, billing contact, technical contact, end user)
- **ITIL Terminology** - Proper ITIL terminology throughout the interface (Customers, Users, etc.)

#### Improved Ticket Workflow
- **New Status System** - Streamlined ticket statuses: Unassigned → Assigned → In Progress → Closed
- **Automatic Status Updates** - Status automatically updates based on ticket assignment
- **Enhanced Ticket Views** - Modal view for quick ticket inspection and full edit pages
- **Better Assignment Logic** - Clear workflow from unassigned to assigned tickets

#### Comprehensive Audit & Security
- **Audit Logging** - Complete audit trail of all system activities
- **Security Events** - Track login attempts, permission changes, and data modifications
- **Compliance Reporting** - Built-in compliance reports for regulatory requirements
- **User Activity Monitoring** - Monitor user actions and system usage

#### Advanced Analytics & Reporting
- **SLA Compliance Tracking** - Monitor SLA violations and response times
- **Performance Metrics** - Track ticket resolution times, customer satisfaction, and team productivity
- **Custom Dashboards** - Create personalized dashboards with key metrics
- **Export Capabilities** - Export reports in multiple formats

#### Enhanced Client Portal
- **Self-Service Features** - Clients can create tickets, view knowledge base, and track progress
- **User Management** - Clients can manage their own users and permissions
- **Real-time Updates** - Live notifications and status updates
- **Mobile-Friendly** - Responsive design for mobile access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis (for caching and sessions)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RossNicholson/HelpMe.git
   cd HelpMe
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   cd backend
   npm run migrate
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api-docs

## 📁 Project Structure

```
HelpMe/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── migrations/         # Database migrations
│   └── tests/              # Backend tests
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── docs/                   # Documentation
├── docker/                 # Docker configuration
└── scripts/                # Build and deployment scripts
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/helpme
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (Optional)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# File Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=helpme-uploads

# API
API_PORT=8000
NODE_ENV=development
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_APP_NAME=HelpMe
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

## 📚 Documentation

Comprehensive documentation is available in the [HelpMe Wiki](https://github.com/RossNicholson/HelpMe-wiki):

- [Getting Started Guide](https://github.com/RossNicholson/HelpMe-wiki/wiki/Getting-Started)
- [API Reference](https://github.com/RossNicholson/HelpMe-wiki/wiki/API-Reference)
- [Deployment Guide](https://github.com/RossNicholson/HelpMe-wiki/wiki/Deployment)
- [Feature Documentation](https://github.com/RossNicholson/HelpMe-wiki/wiki/Features)
- [ITIL Best Practices](https://github.com/RossNicholson/HelpMe-wiki/wiki/ITIL-Compliance)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [HelpMe Wiki](https://github.com/RossNicholson/HelpMe-wiki)
- **Issues**: [GitHub Issues](https://github.com/RossNicholson/HelpMe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RossNicholson/HelpMe/discussions)
- **Email**: helpme@rossnicholson.dev

## 🏆 Why HelpMe is the Best MSP Ticket System

### 🏢 Enterprise-Grade Features
- **Multi-tenant architecture** supporting unlimited clients and organizations
- **Role-based access control** with granular permissions
- **Complete audit logging** for compliance and security
- **SLA management** with automated violation tracking
- **Escalation rules** for automated ticket handling

### 🔒 Security & Privacy
- **On-premise deployment** - Your data never leaves your infrastructure
- **No SaaS dependencies** - Complete control over your environment
- **Encrypted data storage** with secure authentication
- **Regular security updates** and vulnerability patches

### 📊 ITIL Compliance
- **ITIL-aligned workflows** and terminology
- **Service lifecycle management** from request to resolution
- **Configuration management** with asset tracking
- **Change management** processes and approvals
- **Knowledge management** with centralized documentation

### 🚀 Performance & Scalability
- **Modern tech stack** with React, Node.js, and PostgreSQL
- **Real-time updates** via WebSocket connections
- **Optimized database queries** with proper indexing
- **Caching layer** for improved performance
- **Horizontal scaling** capabilities

### 💼 MSP-Specific Features
- **Client portal** for self-service ticket management
- **Time tracking** for accurate billing and productivity
- **Contract management** with service level tracking
- **Multi-location support** for distributed clients
- **Integration APIs** for PSA and RMM tools

### 🎯 User Experience
- **Intuitive interface** designed for MSP workflows
- **Mobile responsive** design for field technicians
- **Advanced search and filtering** for quick data access
- **Customizable dashboards** with key metrics
- **Real-time notifications** via email and SMS

HelpMe is the complete solution for MSPs who demand enterprise-grade functionality without the SaaS compromises. Deploy it on your infrastructure, customize it to your workflow, and scale it with your business.

---

**Built with ❤️ for MSPs who value control, security, and ITIL best practices.**
