# 🚀 Claude NerfDetector is LIVE!

## Community Performance Monitoring for Claude Code

### Quick Start
Run this command directly in Claude Code:
```bash
npx claude-nerf-test
```

### What is this?
NerfDetector is a community-driven tool to track Claude Code's performance over time. By running standardized tests, we can collectively detect when Claude's capabilities change ("nerfs" or improvements).

### Features
- **5 Challenging Tests**: Algorithm implementation, log parsing, bug fixing, complex generation, and math reasoning
- **Anonymous Tracking**: No personal data collected, only performance metrics
- **Community Comparison**: See how your Claude performs vs the global average
- **Real-time Dashboard**: View global statistics at https://claude-nerf-detector.vercel.app

### How it Works
1. Run `npx claude-nerf-test` in Claude Code
2. Claude will respond to 5 test prompts
3. Results are anonymously submitted to the community database
4. You get instant feedback on how your Claude performs vs others
5. View global trends on the dashboard

### Privacy First
- ✅ Anonymous user IDs (hashed machine ID)
- ✅ Performance metrics only
- ✅ No prompt/response content stored
- ✅ No personal information collected
- ✅ Run locally with `--local` flag to skip submission

### Commands
```bash
# Run tests and submit to community
npx claude-nerf-test

# Run tests locally only (no submission)
npx claude-nerf-test run --local

# View your configuration
npx claude-nerf-test config --show

# Reset your anonymous ID
npx claude-nerf-test config --reset
```

### Dashboard
View global performance statistics: https://claude-nerf-detector.vercel.app

### Contributing
This is an open-source community project. Contributions welcome!
- GitHub: https://github.com/Solaris-Partners/claude-nerf-detector
- NPM Package: https://www.npmjs.com/package/claude-nerf-test

### Why "NerfDetector"?
In gaming, a "nerf" is when something gets weakened in an update. This tool helps detect if Claude's capabilities change over time - whether they improve or degrade.

---

Built with ❤️ by the Claude Code community