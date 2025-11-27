# Cosmos UI

A modern, beautiful UI for managing Azure Cosmos DB databases and documents.

![Cosmos UI](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

## Features

### 🔐 Authentication
- **Connection String**: Enter your Cosmos DB connection string (stored securely encoded in localStorage for convenience)
- **Credentials Form**: Enter endpoint and account key separately (credentials are NOT stored)

### 📊 Database Explorer
- Browse all databases in your Cosmos DB account
- Expandable sidebar showing databases and their containers
- Real-time loading states and feedback

### 📝 Document Management
- View documents in a paginated data table
- Create new documents with JSON editor
- Edit existing documents
- Delete documents with confirmation dialog
- Click any row to view the full document details

### 🔍 Query Editor
- Execute raw SQL queries against your containers
- Results displayed in the same data table
- Reset to default view anytime

### 🎨 Modern UI
- Dark theme with cyan/blue accent colors
- Smooth animations and transitions
- Toast notifications for all operations
- Responsive design

## Getting Started

### Prerequisites
- Node.js 18+ 
- An Azure Cosmos DB account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cosmos-ui
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:8085](http://localhost:8085) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Connecting to Cosmos DB

1. **Using Connection String** (Recommended for convenience):
   - Go to your Azure Portal → Cosmos DB Account → Keys
   - Copy the "PRIMARY CONNECTION STRING"
   - Paste it in the Connection String field
   - The connection string will be encoded and stored in localStorage for future visits

2. **Using Credentials** (More secure):
   - Enter your Account Endpoint (e.g., `https://your-account.documents.azure.com:443/`)
   - Enter your Primary or Secondary Key
   - Credentials are NOT stored locally

### Browsing Data

1. After connecting, the sidebar shows all your databases
2. Click a database to expand and see its containers
3. Click a container to load its documents
4. Use pagination controls to navigate through documents

### Querying Data

1. Click on "Query Editor" to expand
2. Enter your SQL query (e.g., `SELECT * FROM c WHERE c.status = 'active'`)
3. Click "Execute" to run the query
4. Results will replace the current table view
5. Click "Reset" to go back to the default view

### Managing Documents

- **Create**: Click "Create Document" button, enter JSON, and save
- **View**: Click any row to open the document viewer
- **Edit**: Click the edit icon or "Edit" from the viewer
- **Delete**: Click the delete icon and confirm

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components inspired by shadcn/ui
- **Database SDK**: @azure/cosmos
- **State Management**: React Context
- **Notifications**: Sonner
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── api/cosmos/       # API routes for Cosmos DB operations
│   ├── dashboard/        # Dashboard page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Login page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── data-table.tsx    # Document data table
│   ├── document-dialog.tsx # View/Edit/Create dialog
│   ├── login-form.tsx    # Login form component
│   ├── query-box.tsx     # Query editor
│   └── sidebar.tsx       # Database navigation sidebar
└── lib/
    ├── cosmos-context.tsx # Global state management
    ├── types.ts          # TypeScript interfaces
    └── utils.ts          # Utility functions
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cosmos/connect` | POST | Test connection to Cosmos DB |
| `/api/cosmos/databases` | POST | List all databases |
| `/api/cosmos/containers` | POST | List containers in a database |
| `/api/cosmos/documents` | POST | List documents with pagination |
| `/api/cosmos/query` | POST | Execute SQL query |
| `/api/cosmos/documents/create` | POST | Create a new document |
| `/api/cosmos/documents/update` | POST | Update an existing document |
| `/api/cosmos/documents/delete` | POST | Delete a document |

## Security Notes

- Connection strings stored in localStorage are Base64 encoded (not encrypted)
- For production use, consider implementing server-side session management
- Credentials form option does not store any data locally
- All Cosmos DB operations are performed server-side via API routes

## License

MIT
