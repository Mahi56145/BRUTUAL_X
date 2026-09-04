/**
 * Seed file: Creates subjects, topics, users (clean — no fake progress)
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 *
 * IMPORTANT: Both users start with onboardingDone = false.
 * NO fake mastery, NO fake sessions, NO fake streaks.
 * All progress must come from real user activity.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ──────────────────────────────────────────────────────────────────────────────
// SUBJECTS + TOPICS MASTER DATA
// ──────────────────────────────────────────────────────────────────────────────

const SUBJECTS = [
  {
    name: 'Programming',
    slug: 'programming',
    description: 'Core programming fundamentals and software engineering basics',
    icon: '💻',
    color: '#6c63ff',
    gateWeight: 0.08,
    order: 0,
    topics: [
      { name: 'Programming Fundamentals', slug: 'fundamentals', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 1, estimatedMinutes: 60 },
      { name: 'Variables and Data Types', slug: 'variables', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 1, estimatedMinutes: 45 },
      { name: 'Control Flow', slug: 'control-flow', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 2, estimatedMinutes: 60 },
      { name: 'Functions & Recursion', slug: 'functions', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Pointers & References', slug: 'pointers', importance: 4, gateRelevance: 3, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Arrays & Strings', slug: 'arrays-strings', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 2, estimatedMinutes: 75 },
      { name: 'Structures & OOP', slug: 'oop', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Classes & Inheritance', slug: 'inheritance', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Polymorphism & Encapsulation', slug: 'polymorphism', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Templates & Generics', slug: 'templates', importance: 3, gateRelevance: 2, careerRelevance: 4, difficulty: 4, estimatedMinutes: 60 },
      { name: 'STL / Standard Library', slug: 'stl', importance: 4, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Memory Management', slug: 'memory', importance: 4, gateRelevance: 3, careerRelevance: 4, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Exception Handling', slug: 'exceptions', importance: 3, gateRelevance: 1, careerRelevance: 4, difficulty: 3, estimatedMinutes: 45 },
      { name: 'File Handling', slug: 'files', importance: 3, gateRelevance: 1, careerRelevance: 3, difficulty: 2, estimatedMinutes: 45 },
      { name: 'Multithreading Basics', slug: 'multithreading', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Git & Version Control', slug: 'git', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 2, estimatedMinutes: 60 },
      { name: 'Clean Code & Design Patterns', slug: 'clean-code', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
    ],
  },
  {
    name: 'Data Structures & Algorithms',
    slug: 'dsa',
    description: 'Core DSA for interviews, competitive programming, and GATE',
    icon: '🔗',
    color: '#00d4aa',
    gateWeight: 0.15,
    order: 1,
    topics: [
      { name: 'Complexity Analysis & Big O', slug: 'complexity', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Arrays', slug: 'arrays', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 2, estimatedMinutes: 90 },
      { name: 'Strings', slug: 'strings', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Linked Lists', slug: 'linked-lists', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Stacks & Queues', slug: 'stacks-queues', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Hash Tables', slug: 'hash-tables', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Trees & BST', slug: 'trees', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 4, estimatedMinutes: 120 },
      { name: 'AVL Trees & Heaps', slug: 'avl-heaps', importance: 4, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Tries', slug: 'tries', importance: 3, gateRelevance: 3, careerRelevance: 4, difficulty: 4, estimatedMinutes: 60 },
      { name: 'Graphs: BFS & DFS', slug: 'graph-bfs-dfs', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 4, estimatedMinutes: 120 },
      { name: 'Topological Sort', slug: 'topo-sort', importance: 4, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 60 },
      { name: 'Shortest Paths (Dijkstra, BF, FW)', slug: 'shortest-paths', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 5, estimatedMinutes: 120 },
      { name: 'MST (Prim, Kruskal)', slug: 'mst', importance: 4, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'DSU / Union-Find', slug: 'dsu', importance: 3, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 60 },
      { name: 'Searching & Binary Search', slug: 'binary-search', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Sorting Algorithms', slug: 'sorting', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Two Pointers & Sliding Window', slug: 'two-pointers', importance: 4, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Divide & Conquer', slug: 'divide-conquer', importance: 4, gateRelevance: 4, careerRelevance: 4, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Greedy Algorithms', slug: 'greedy', importance: 4, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Dynamic Programming', slug: 'dp', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 5, estimatedMinutes: 150 },
      { name: 'Backtracking', slug: 'backtracking', importance: 4, gateRelevance: 4, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Bit Manipulation', slug: 'bit-manipulation', importance: 3, gateRelevance: 4, careerRelevance: 4, difficulty: 3, estimatedMinutes: 60 },
      { name: 'GATE DSA Problems', slug: 'gate-dsa', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 120 },
      { name: 'Interview Problems', slug: 'interview-problems', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 4, estimatedMinutes: 120 },
    ],
  },
  {
    name: 'Operating Systems',
    slug: 'os',
    description: 'OS concepts critical for GATE and systems programming',
    icon: '⚙️',
    color: '#ff8c42',
    gateWeight: 0.12,
    order: 2,
    topics: [
      { name: 'OS Fundamentals & Kernel', slug: 'os-fundamentals', importance: 5, gateRelevance: 4, careerRelevance: 4, difficulty: 2, estimatedMinutes: 60 },
      { name: 'Processes & PCB', slug: 'processes', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Threads & IPC', slug: 'threads', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'CPU Scheduling', slug: 'cpu-scheduling', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'FCFS, SJF, SRTF', slug: 'scheduling-algos', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Round Robin & Multilevel Queues', slug: 'rr-mlq', importance: 4, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Synchronization & Race Conditions', slug: 'synchronization', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 5, estimatedMinutes: 120 },
      { name: 'Mutex, Semaphore, Monitors', slug: 'mutex-semaphore', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 5, estimatedMinutes: 90 },
      { name: 'Classic Sync Problems', slug: 'sync-problems', importance: 4, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Deadlocks', slug: 'deadlocks', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: "Banker's Algorithm", slug: 'bankers', importance: 4, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 60 },
      { name: 'Memory Management & Paging', slug: 'paging', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Virtual Memory & TLB', slug: 'virtual-memory', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Page Replacement Algorithms', slug: 'page-replacement', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'File Systems', slug: 'file-systems', importance: 4, gateRelevance: 4, careerRelevance: 4, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Disk Scheduling & I/O', slug: 'disk-io', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Linux Internals', slug: 'linux', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
    ],
  },
  {
    name: 'DBMS',
    slug: 'dbms',
    description: 'Database fundamentals, SQL, and advanced DB concepts',
    icon: '🗄️',
    color: '#2ed573',
    gateWeight: 0.12,
    order: 3,
    topics: [
      { name: 'DBMS Fundamentals & Relational Model', slug: 'dbms-fundamentals', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 2, estimatedMinutes: 60 },
      { name: 'SQL Basics & Joins', slug: 'sql-basics', importance: 5, gateRelevance: 4, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Subqueries & CTEs', slug: 'subqueries', importance: 4, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Window Functions & Aggregation', slug: 'window-functions', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Relational Algebra', slug: 'relational-algebra', importance: 4, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'ER Model', slug: 'er-model', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Functional Dependencies', slug: 'functional-deps', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Normalization (1NF–BCNF)', slug: 'normalization', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Transactions & ACID', slug: 'transactions', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Concurrency Control & Locks', slug: 'concurrency', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 5, estimatedMinutes: 90 },
      { name: 'Two-Phase Locking & MVCC', slug: '2pl-mvcc', importance: 4, gateRelevance: 5, careerRelevance: 4, difficulty: 5, estimatedMinutes: 75 },
      { name: 'Recovery, WAL & Checkpoints', slug: 'recovery', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 60 },
      { name: 'Indexing: B+ Trees & Hash', slug: 'indexing', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Query Optimization', slug: 'query-opt', importance: 4, gateRelevance: 3, careerRelevance: 5, difficulty: 4, estimatedMinutes: 75 },
      { name: 'NoSQL, CAP & Sharding', slug: 'nosql', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
    ],
  },
  {
    name: 'Computer Networks',
    slug: 'cn',
    description: 'Networking concepts from OSI model to HTTP and beyond',
    icon: '🌐',
    color: '#5352ed',
    gateWeight: 0.10,
    order: 4,
    topics: [
      { name: 'Network Fundamentals & OSI Model', slug: 'osi', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 2, estimatedMinutes: 75 },
      { name: 'TCP/IP & Encapsulation', slug: 'tcpip', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Ethernet, MAC & Switching', slug: 'ethernet', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 3, estimatedMinutes: 60 },
      { name: 'IPv4, IPv6 & Subnetting', slug: 'ip-subnetting', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'ARP, ICMP, NAT, DHCP', slug: 'arp-icmp', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Routing: RIP, OSPF, BGP', slug: 'routing', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'TCP: Handshake & Flow Control', slug: 'tcp-flow', importance: 5, gateRelevance: 5, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'TCP: Congestion Control', slug: 'tcp-congestion', importance: 4, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 75 },
      { name: 'UDP & Ports', slug: 'udp', importance: 4, gateRelevance: 4, careerRelevance: 4, difficulty: 2, estimatedMinutes: 45 },
      { name: 'HTTP, HTTPS & DNS', slug: 'http-dns', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'TLS, Certificates & Security', slug: 'tls', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Firewalls, VPN & Load Balancing', slug: 'firewall-vpn', importance: 3, gateRelevance: 2, careerRelevance: 4, difficulty: 3, estimatedMinutes: 60 },
      { name: 'WebSockets & Real-time', slug: 'websockets', importance: 3, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Network Debugging', slug: 'net-debug', importance: 3, gateRelevance: 1, careerRelevance: 4, difficulty: 3, estimatedMinutes: 45 },
    ],
  },
  {
    name: 'Computer Organization & Architecture',
    slug: 'coa',
    description: 'Digital logic, CPU design, and computer architecture',
    icon: '🖥️',
    color: '#ffa502',
    gateWeight: 0.10,
    order: 5,
    topics: [
      { name: 'Number Systems & Boolean Algebra', slug: 'number-systems', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 2, estimatedMinutes: 75 },
      { name: 'Logic Gates & Combinational Circuits', slug: 'logic-gates', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Sequential Circuits', slug: 'sequential', importance: 4, gateRelevance: 5, careerRelevance: 2, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Number Representation & IEEE 754', slug: 'ieee754', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'CPU: Registers, ALU, Control Unit', slug: 'cpu', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Instruction Cycle & ISA', slug: 'isa', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Addressing Modes', slug: 'addressing', importance: 4, gateRelevance: 5, careerRelevance: 2, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Memory Hierarchy & Cache', slug: 'cache', importance: 5, gateRelevance: 5, careerRelevance: 4, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Cache Mapping Techniques', slug: 'cache-mapping', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Pipelining & Hazards', slug: 'pipelining', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Branch Prediction', slug: 'branch-prediction', importance: 3, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 60 },
      { name: 'I/O, Interrupts & DMA', slug: 'io-dma', importance: 4, gateRelevance: 4, careerRelevance: 2, difficulty: 3, estimatedMinutes: 60 },
      { name: 'RISC vs CISC & Superscalar', slug: 'risc-cisc', importance: 3, gateRelevance: 3, careerRelevance: 2, difficulty: 3, estimatedMinutes: 45 },
      { name: 'Multicore, SIMD & GPU Basics', slug: 'multicore', importance: 3, gateRelevance: 2, careerRelevance: 4, difficulty: 4, estimatedMinutes: 60 },
    ],
  },
  {
    name: 'Theory of Computation',
    slug: 'toc',
    description: 'Automata, formal languages, and computability',
    icon: '🧮',
    color: '#ff6b81',
    gateWeight: 0.10,
    order: 6,
    topics: [
      { name: 'DFA & NFA', slug: 'dfa-nfa', importance: 5, gateRelevance: 5, careerRelevance: 2, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Regular Languages & Regex', slug: 'regular-lang', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Closure Properties & Pumping Lemma', slug: 'pumping-lemma', importance: 4, gateRelevance: 5, careerRelevance: 2, difficulty: 4, estimatedMinutes: 75 },
      { name: 'DFA Minimization & Myhill-Nerode', slug: 'dfa-min', importance: 4, gateRelevance: 5, careerRelevance: 2, difficulty: 4, estimatedMinutes: 75 },
      { name: 'CFG & Parse Trees', slug: 'cfg', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'PDA & Context-Free Languages', slug: 'pda', importance: 4, gateRelevance: 5, careerRelevance: 2, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Turing Machines', slug: 'turing', importance: 5, gateRelevance: 5, careerRelevance: 2, difficulty: 5, estimatedMinutes: 90 },
      { name: 'Decidability & Recognizability', slug: 'decidability', importance: 5, gateRelevance: 5, careerRelevance: 2, difficulty: 5, estimatedMinutes: 75 },
      { name: "Reductions & Rice's Theorem", slug: 'reductions', importance: 4, gateRelevance: 5, careerRelevance: 2, difficulty: 5, estimatedMinutes: 75 },
      { name: 'P, NP, NP-Complete', slug: 'np', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 5, estimatedMinutes: 90 },
    ],
  },
  {
    name: 'Compiler Design',
    slug: 'compiler',
    description: 'Compiler phases from lexical analysis to code generation',
    icon: '🔧',
    color: '#a29bfe',
    gateWeight: 0.08,
    order: 7,
    topics: [
      { name: 'Compiler Architecture & Phases', slug: 'compiler-arch', importance: 5, gateRelevance: 4, careerRelevance: 3, difficulty: 2, estimatedMinutes: 60 },
      { name: 'Lexical Analysis & Tokens', slug: 'lexical', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Syntax Analysis & CFG', slug: 'syntax', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Top-Down Parsing: LL', slug: 'll-parsing', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Bottom-Up Parsing: LR, SLR, CLR, LALR', slug: 'lr-parsing', importance: 5, gateRelevance: 5, careerRelevance: 3, difficulty: 5, estimatedMinutes: 120 },
      { name: 'Semantic Analysis & Type Checking', slug: 'semantic', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Intermediate Representation', slug: 'ir', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Runtime Environments & Activation Records', slug: 'runtime', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Code Optimization', slug: 'optimization', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Code Generation & Register Allocation', slug: 'codegen', importance: 4, gateRelevance: 4, careerRelevance: 3, difficulty: 4, estimatedMinutes: 75 },
    ],
  },
  {
    name: 'Software Engineering',
    slug: 'se',
    description: 'SDLC, design principles, testing, and professional practices',
    icon: '📐',
    color: '#fd79a8',
    gateWeight: 0.05,
    order: 8,
    topics: [
      { name: 'SDLC & Agile', slug: 'sdlc', importance: 4, gateRelevance: 3, careerRelevance: 5, difficulty: 2, estimatedMinutes: 60 },
      { name: 'Requirements Engineering', slug: 'requirements', importance: 4, gateRelevance: 3, careerRelevance: 4, difficulty: 2, estimatedMinutes: 60 },
      { name: 'SOLID & Design Patterns', slug: 'solid', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Software Architecture', slug: 'architecture', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Testing: Unit, Integration, System', slug: 'testing', importance: 5, gateRelevance: 3, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'TDD & CI/CD', slug: 'tdd-cicd', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Code Review, Logging & Monitoring', slug: 'code-review', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 2, estimatedMinutes: 45 },
      { name: 'Reliability & Fault Tolerance', slug: 'reliability', importance: 4, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 60 },
    ],
  },
  {
    name: 'System Design',
    slug: 'system-design',
    description: 'Large-scale system design for senior engineering interviews',
    icon: '🏗️',
    color: '#00cec9',
    gateWeight: 0.05,
    order: 9,
    topics: [
      { name: 'Requirements & Scalability', slug: 'requirements-scalability', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Monolith vs Microservices', slug: 'microservices', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'API Design: REST, GraphQL, RPC', slug: 'api-design', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Databases: SQL vs NoSQL', slug: 'db-choice', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 3, estimatedMinutes: 60 },
      { name: 'Caching & CAP Theorem', slug: 'caching-cap', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Replication, Sharding & Partitioning', slug: 'sharding', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Load Balancing & Message Queues', slug: 'lb-mq', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 75 },
      { name: 'Distributed Systems Patterns', slug: 'distributed', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 5, estimatedMinutes: 90 },
      { name: 'Observability: Logs, Metrics, Traces', slug: 'observability', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 60 },
      { name: 'URL Shortener Design', slug: 'url-shortener', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Chat & Video Platform Design', slug: 'chat-design', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Payment & Notification Systems', slug: 'payment-notif', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
    ],
  },
  {
    name: 'ML & AI',
    slug: 'ml',
    description: 'Machine learning, deep learning, and MLOps',
    icon: '🤖',
    color: '#6c5ce7',
    gateWeight: 0.05,
    order: 10,
    topics: [
      { name: 'Linear Algebra for ML', slug: 'linear-algebra', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 120 },
      { name: 'Probability & Statistics', slug: 'probability', importance: 5, gateRelevance: 2, careerRelevance: 5, difficulty: 4, estimatedMinutes: 120 },
      { name: 'Calculus & Optimization', slug: 'calculus', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'ML Fundamentals: Regression & Classification', slug: 'ml-basics', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 90 },
      { name: 'Decision Trees & Ensemble Methods', slug: 'decision-trees', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'SVM, KNN & Clustering', slug: 'svm-knn', importance: 4, gateRelevance: 1, careerRelevance: 4, difficulty: 3, estimatedMinutes: 75 },
      { name: 'PCA & Feature Engineering', slug: 'pca-features', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'Model Evaluation & Cross-Validation', slug: 'evaluation', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 75 },
      { name: 'Neural Networks & Backpropagation', slug: 'neural-nets', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 120 },
      { name: 'CNN & Computer Vision', slug: 'cnn', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
      { name: 'RNN & Sequential Models', slug: 'rnn', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 5, estimatedMinutes: 90 },
      { name: 'Transformers & Attention', slug: 'transformers', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 5, estimatedMinutes: 120 },
      { name: 'NumPy, Pandas & Matplotlib', slug: 'numpy-pandas', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 2, estimatedMinutes: 90 },
      { name: 'Scikit-learn & PyTorch', slug: 'sklearn-pytorch', importance: 5, gateRelevance: 1, careerRelevance: 5, difficulty: 3, estimatedMinutes: 120 },
      { name: 'ML Pipelines & Model Deployment', slug: 'mlops', importance: 4, gateRelevance: 1, careerRelevance: 5, difficulty: 4, estimatedMinutes: 90 },
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS CATALOG
// ──────────────────────────────────────────────────────────────────────────────

const ACHIEVEMENTS = [
  { slug: 'first-session', title: 'First Step', description: 'Complete your first study session', icon: '🚀', xpReward: 50, category: 'general' },
  { slug: 'first-7-day-streak', title: '7-Day Warrior', description: 'Maintain a 7-day study streak', icon: '🔥', xpReward: 200, category: 'streak' },
  { slug: 'first-30-day-streak', title: 'Month of Mastery', description: 'Maintain a 30-day study streak', icon: '🏆', xpReward: 1000, category: 'streak' },
  { slug: 'first-weak-topic-mastered', title: 'Weakness Conquered', description: 'Bring a weak topic above 70% mastery', icon: '🧠', xpReward: 150, category: 'mastery' },
  { slug: '50-gate-pyqs', title: 'GATE Grinder', description: 'Solve 50 GATE PYQs', icon: '🎯', xpReward: 300, category: 'gate' },
  { slug: '100-dsa-problems', title: 'DSA Warrior', description: 'Solve 100 DSA problems', icon: '⚔️', xpReward: 400, category: 'dsa' },
  { slug: '5-subjects-assessed', title: 'Broad Foundation', description: 'Complete assessment for 5 subjects', icon: '📚', xpReward: 100, category: 'general' },
  { slug: '10-revisions', title: 'Retention Master', description: 'Complete 10 successful revisions', icon: '🔄', xpReward: 150, category: 'mastery' },
  { slug: 'comeback-complete', title: 'Comeback King', description: 'Return after a break and complete your first comeback plan', icon: '💪', xpReward: 250, category: 'comeback' },
  { slug: '30-active-days', title: '30 Days Strong', description: 'Complete 30 active study days', icon: '📅', xpReward: 500, category: 'consistency' },
  { slug: 'first-assessment', title: 'Self Aware', description: 'Complete your initial knowledge assessment', icon: '🔍', xpReward: 75, category: 'general' },
  { slug: 'accuracy-80', title: 'Sharp Mind', description: 'Achieve 80%+ accuracy in a quiz session', icon: '🎯', xpReward: 100, category: 'mastery' },
  { slug: 'full-day-plan', title: 'Disciplined', description: 'Complete 100% of a day\'s planned tasks', icon: '✅', xpReward: 200, category: 'consistency' },
]

// ──────────────────────────────────────────────────────────────────────────────
// GATE QUESTIONS (real educational data — not fake progress)
// ──────────────────────────────────────────────────────────────────────────────

async function seedQuestions(topicMap: Record<string, string>) {
  const questions = [
    // OS Synchronization
    {
      topicSlug: 'synchronization',
      text: 'Which of the following is NOT a necessary condition for deadlock?',
      optionA: 'Mutual Exclusion',
      optionB: 'Hold and Wait',
      optionC: 'No Preemption',
      optionD: 'Circular Dependency',
      answer: 'D',
      explanation: 'The 4 necessary conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait (not "dependency").',
      difficulty: 3, isGatePYQ: true, gateYear: 2022,
    },
    {
      topicSlug: 'synchronization',
      text: 'A semaphore initialized to 1 can be used as a:',
      optionA: 'Counting semaphore only',
      optionB: 'Binary semaphore / Mutex',
      optionC: 'Barrier',
      optionD: 'Message queue',
      answer: 'B',
      explanation: 'A semaphore initialized to 1 acts as a binary semaphore (mutex), allowing only one process at a time.',
      difficulty: 2, isGatePYQ: true, gateYear: 2021,
    },
    // DSA DP
    {
      topicSlug: 'dp',
      text: 'What is the time complexity of the standard 0/1 Knapsack DP solution?',
      optionA: 'O(n log n)',
      optionB: 'O(n * W)',
      optionC: 'O(2^n)',
      optionD: 'O(n^2)',
      answer: 'B',
      explanation: 'The DP table has n items × W capacity cells, each computed in O(1), giving O(n*W) overall.',
      difficulty: 2, isGatePYQ: false,
    },
    // DBMS Normalization
    {
      topicSlug: 'normalization',
      text: 'A relation is in BCNF if for every non-trivial FD X → Y, X is a:',
      optionA: 'Prime attribute',
      optionB: 'Superkey',
      optionC: 'Foreign key',
      optionD: 'Candidate key only',
      answer: 'B',
      explanation: 'BCNF requires that for every non-trivial functional dependency X → Y, X must be a superkey.',
      difficulty: 3, isGatePYQ: true, gateYear: 2023,
    },
    // COA Pipelining
    {
      topicSlug: 'pipelining',
      text: 'A 5-stage pipeline has a clock cycle of 10ns. What is the throughput for a long sequence of independent instructions?',
      optionA: '1 instruction per 50ns',
      optionB: '1 instruction per 10ns',
      optionC: '5 instructions per 10ns',
      optionD: '1 instruction per 2ns',
      answer: 'B',
      explanation: 'In a fully pipelined processor, once the pipeline is full, one instruction completes per clock cycle (10ns).',
      difficulty: 3, isGatePYQ: true, gateYear: 2020,
    },
    // TOC
    {
      topicSlug: 'np',
      text: 'Which of the following problems is NP-Complete?',
      optionA: 'Sorting n integers',
      optionB: 'Finding shortest path in a weighted graph',
      optionC: 'Satisfiability (SAT)',
      optionD: 'Binary search',
      answer: 'C',
      explanation: 'SAT (Boolean Satisfiability) was the first problem proven to be NP-Complete (Cook-Levin theorem).',
      difficulty: 3, isGatePYQ: true, gateYear: 2019,
    },
  ]

  for (const q of questions) {
    const topicId = topicMap[q.topicSlug]
    if (!topicId) continue
    await prisma.question.create({
      data: {
        topicId,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        isGatePYQ: q.isGatePYQ,
        gateYear: q.gateYear,
      },
    })
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Engineering OS database (CLEAN — no fake progress)...')
  console.log('')

  // ── Clear ALL existing data ──
  await prisma.userAchievement.deleteMany()
  await prisma.quizAttempt.deleteMany()
  await prisma.question.deleteMany()
  await prisma.sharedMessage.deleteMany()
  await prisma.masteryHistory.deleteMany()
  await prisma.topicMastery.deleteMany()
  await prisma.spacedRevision.deleteMany()
  await prisma.scheduleBlock.deleteMany()
  await prisma.dailySchedule.deleteMany()
  await prisma.sessionItem.deleteMany()
  await prisma.studySession.deleteMany()
  await prisma.collegeDeadline.deleteMany()
  await prisma.dailyCheckIn.deleteMany()
  await prisma.overtimeSlot.deleteMany()
  await prisma.weeklyReport.deleteMany()
  await prisma.missedSession.deleteMany()
  await prisma.relaxationPeriod.deleteMany()
  await prisma.userGoal.deleteMany()
  await prisma.streak.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.topicPrerequisite.deleteMany()
  await prisma.topic.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared all existing data')

  // ── Create Achievement Catalog ──
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.create({ data: ach })
  }
  console.log('✅ Achievement catalog created')

  // ── Create Users ──
  const passwordHash = await bcrypt.hash('engineering123', 12)

  const shivraj = await prisma.user.create({
    data: {
      name: 'Shivraj',
      email: 'shivraj@engineeringos.dev',
      passwordHash,
      avatarInitials: 'SJ',
      accentColor: '#6c63ff',
      gateTarget: 750,
      careerPaths: JSON.stringify(['Backend Engineer', 'Systems Engineer']),
      onboardingDone: false,   // ← MUST be false — start fresh
      realityCheckStyle: 'savage',
      xp: 0,
      level: 1,
    },
  })

  const mahipal = await prisma.user.create({
    data: {
      name: 'Mahipal',
      email: 'mahipal@engineeringos.dev',
      passwordHash,
      avatarInitials: 'MP',
      accentColor: '#00d4aa',
      gateTarget: 650,
      careerPaths: JSON.stringify(['ML Engineer', 'Full Stack Engineer']),
      onboardingDone: false,   // ← MUST be false — start fresh
      realityCheckStyle: 'motivational',
      xp: 0,
      level: 1,
    },
  })

  console.log('✅ Users created (onboardingDone = false for both)')

  // ── Create empty Streak records ──
  await prisma.streak.create({
    data: { userId: shivraj.id, currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
  })
  await prisma.streak.create({
    data: { userId: mahipal.id, currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
  })

  // ── Create Subjects and Topics ──
  const topicMap: Record<string, string> = {} // slug -> id

  for (const subjectData of SUBJECTS) {
    const { topics, ...subjectFields } = subjectData
    const subject = await prisma.subject.create({ data: subjectFields })

    for (let i = 0; i < topics.length; i++) {
      const topicData = topics[i]
      const topic = await prisma.topic.create({
        data: {
          ...topicData,
          subjectId: subject.id,
          order: i,
          description: `Comprehensive study of ${topicData.name} within ${subjectData.name}`,
        },
      })
      topicMap[topicData.slug] = topic.id
    }
  }

  console.log('✅ Subjects and topics created')

  // ── Seed GATE Questions (real educational content) ──
  await seedQuestions(topicMap)
  console.log('✅ GATE questions seeded')

  // ── Create default Goals (can be updated during onboarding) ──
  await prisma.userGoal.createMany({
    data: [
      { userId: shivraj.id, type: 'gate', title: 'GATE CS 2026', description: 'Target score 750+', priority: 5 },
      { userId: shivraj.id, type: 'career', title: 'Backend Engineer at top company', priority: 5 },
      { userId: shivraj.id, type: 'dsa', title: 'Complete 300 LeetCode problems', priority: 4 },
      { userId: mahipal.id, type: 'gate', title: 'GATE CS 2026', description: 'Target score 650+', priority: 5 },
      { userId: mahipal.id, type: 'career', title: 'ML Engineer at product company', priority: 5 },
      { userId: mahipal.id, type: 'ml', title: 'Complete end-to-end ML project', priority: 4 },
    ],
  })
  console.log('✅ Default goals created')

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('Login credentials:')
  console.log('  Shivraj  — password: engineering123')
  console.log('  Mahipal  — password: engineering123')
  console.log('')
  console.log('Both users will see the onboarding flow on first login.')
  console.log('NO fake mastery. NO fake sessions. NO fake progress.')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
