# Claude NerfDetector

Community-driven performance monitoring for Claude Code. Detect capability changes ("nerfs") over time through crowdsourced testing.

## 🚀 Quick Start

Run performance tests directly in Claude Code:

```bash
npx claude-nerf-test
```

## 📊 Live Dashboard

View global performance statistics at: [https://claude-nerf.vercel.app](https://claude-nerf.vercel.app)

## 🎯 How It Works

1. **Local Testing**: Users run standardized tests in Claude Code
2. **Anonymous Submission**: Results are sent to our community database
3. **Global Analytics**: Track performance trends across all users
4. **Real-time Monitoring**: Detect changes in Claude's capabilities

## 🧪 Test Suite

Our tests are intentionally challenging (target: 40-60% pass rate):

- **P1**: Algorithm Implementation (kth largest with heap)
- **P2**: Log Parsing (structured data extraction)
- **P3**: Bug Fixing (multiple bug identification)
- **P4**: Complex Generation (CLI app with 6 subcommands)
- **P5**: Math Reasoning (multi-step word problem)

## 📈 Metrics Tracked

- **Correctness Score**: Test pass rate
- **TTFT**: Time to first token
- **Generation Speed**: Tokens per second
- **Output Length**: Response completeness
- **Error Rate**: Reliability metric

## 🔒 Privacy First

- ✅ Anonymous user IDs (hashed machine ID)
- ✅ Performance metrics only
- ❌ No prompt/response content stored
- ❌ No personal information collected
- ❌ No IP addresses logged

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- Vercel account (for deployment)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/solaris-labs/claude-nerf-detector.git
cd claude-nerf-detector
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your Supabase credentials
```

4. Run development server:
```bash
npm run dev
```

### Project Structure

```
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API endpoints
│   │   ├── page.tsx      # Dashboard
│   │   └── run/[id]/     # Individual test results
│   ├── cli/              # NPM package source
│   │   └── test-runner.ts # Core test execution
│   └── lib/
│       └── supabase/     # Database client & schema
├── supabase/
│   └── migrations/       # Database migrations
└── vercel.json          # Deployment config
```

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- Additional test cases
- Dashboard improvements
- Performance optimizations
- Documentation
- Bug fixes

## 📝 License

MIT License

## 🙏 Acknowledgments

Built by the Claude Code community, for the community.

## 🔗 Links

- [Dashboard](https://claude-nerf.vercel.app)
- [NPM Package](https://www.npmjs.com/package/claude-nerf-test)
- [Issue Tracker](https://github.com/solaris-labs/claude-nerf-detector/issues)

---

**Note**: This project is community-driven and not affiliated with Anthropic.