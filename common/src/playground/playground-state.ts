// Class for representing the global state of the playground, including a
// dictionary of users and contracts and the bank. The intention is that
// anywhere a db connection is made to save data in the original code, we'll
// replace that with transient storage in the playground state.
import { NestedLogger } from './nested-logger'
declare global { interface Window { logger: NestedLogger; } }

import { Contract } from "../contract";
import { User } from "../user";
import { Bet, LimitBet } from "../bet";
import { createmarket } from '../api/create-market';
import { placebet } from '../api/place-bet';

const deposit_exempt_categories: string[] = [
  'BUY_SHARES',
  'SELL_SHARES',
  'RESOLUTION_PAYOUT',
]

const EXAMPLE_USER_ID_LIST = [
  'alice',
  'bob',
  'carol',
  'dave',
  'eve',
  'frank',
  'grace',
  'heidi',
  'ivan',
  'judy',
  'mallory',
]

const EXAMPLE_QUESTION_LIST = [
  "Will we succeed in",
  "Will we look funny in",
  "Will we explode before",
]

const DEFAULT_USER_PARAMS = {
    id: '0',
    createdTime: 0,
    name: 'user_name',
    username: 'user_username',
    avatarUrl: '',
    balance: 1000,
    totalDeposits: 1000,
    profitCached: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        allTime: 0
    },
    creatorTraders: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        allTime: 0
    },
    nextLoanCached: 0,
    streakForgiveness: 0
}

const DEFAULT_CONTRACT_PARAMS = {
  // id: '1', // assigned in createmarket
  // slug: 'slug', // assigned in createmarket
  // userId: 'userId', // taken from the request body on manifold, passed in as a separate argument here
  question: 'Will we succeed?', //question
  outcomeType: 'BINARY',
  description: 'This is a description', //description
  initialProb: 50,
  ante: 50,
  closeTime: undefined,
  visibility: 'public',
  isTwitchContract: false,
  min: undefined,
  max: undefined,
  isLogScale: undefined,
  answers: undefined,
  addAnswersMode: undefined,
  shouldAnswersSumToOne: undefined,
  loverUserId1: undefined,
  loverUserId2: undefined
}

const DEFAULT_BET_PARAMS = {
  amount: 10,
  contractId: undefined,
  replyToCommentId: undefined,
}

const DEFAULT_BINARY_BET_PARAMS = {
  ...DEFAULT_BET_PARAMS,
  outcome: 'YES',
  limitProb: undefined,
  expiresAt: undefined,
}

const DEFAULT_MULTI_BET_PARAMS = {
  ...DEFAULT_BINARY_BET_PARAMS,
  answerId: undefined,
}

// Simplified version of Txn from src/ts/lib/manifold/common/src/txn.ts
type SourceType = 'USER' | 'CONTRACT' | 'BANK'// | 'CHARITY' | 'AD' | 'LEAGUE'
type Txn = {
  id: string
  createdTime: number

  fromId: string
  fromType: SourceType

  toId: string
  toType: SourceType

  amount: number
  token: 'M$' | 'SHARE'

  category: string,

  // Any extra data
  data?: { [key: string]: any }

  // Human-readable description
  description?: string
}

type Bank = {
  id: string;
  balance: number;
};

export class PlaygroundState {
  bank: Bank;
  ignoreInArgList: boolean;
  private users: { [key: string]: User };
  private contracts: { [key: string]: Contract };
  private bets: { [key: string]: Bet };
  private txns: { [key: string]: Txn };
  private id_index: number;
  private contract_id_index: number;
  private user_id_index: number;
  private example_question_index: number;


  constructor() {
    this.users = {};
    this.contracts = {};
    this.bets = {};
    this.txns = {};
    this.bank = {
      id: "bank",
      balance: 100000,
    };
    this.id_index = 1;
    this.user_id_index = 0;
    this.contract_id_index = 0;
    this.example_question_index = 0;
    this.ignoreInArgList = true;
  }

  getNextId() {
    return "" + this.id_index++;
  }

  getNextUserId() {
    // From the list of example users
    let id = EXAMPLE_USER_ID_LIST[this.user_id_index % EXAMPLE_USER_ID_LIST.length];
    // If we reached the end of the list, go back and add a 1, etc.
    if (this.user_id_index >= EXAMPLE_USER_ID_LIST.length) {
      id += Math.floor(this.user_id_index / EXAMPLE_USER_ID_LIST.length) + 1;
    }
    this.user_id_index++
    this.getNextId()
    return id
  }

  getNextContractId() {
    // Cycle through A to Z, then AA to ZZ
    let id = ""
    if (this.contract_id_index >= 26) {
      id += String.fromCharCode(65 + Math.floor(this.contract_id_index / 26) - 1);
    }
    id += String.fromCharCode(65 + this.contract_id_index % 26);
    this.contract_id_index++
    return id
  }

  getNextExampleQuestion() {
    return EXAMPLE_QUESTION_LIST[this.example_question_index % EXAMPLE_QUESTION_LIST.length]
    + " " + (2024 + Math.floor(this.example_question_index++ / EXAMPLE_QUESTION_LIST.length)) + "?";
  }

  addUser(user: User) {
    if (this.users[user.id]) {
      window.logger.throw("PlaygroundError", `User ${user.id} already exists`);
    }
    this.users[user.id] = user;
    window.logger.pLog(`Saving user "${user.id}"`, user);
    return user
  }

  addUserWithDefaultProps(overrides: Partial<User> = {}) {
    const id = overrides['id'] || this.getNextUserId();
    const user = {
      ...DEFAULT_USER_PARAMS,
      id: id,
      username: id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      createdTime: Date.now(),
      ...overrides,
    } as User;
    return this.addUser(user);
  }

  getUser(id: string) {
    return this.users[id];
  }

  getUsers() {
    return Object.values(this.users);
  }

  getFirstUser() {
    const users = Object.values(this.users);
    if (users.length > 0) return users[0];

    window.logger.pLog(`No users exist. Creating a default user`);
    window.logger.in()
    const user = this.addUserWithDefaultProps();
    window.logger.out()
    return user
  }

  addContractWithDefaultProps(userId = undefined, overrides: any = {}) {
    if (!userId) {
      userId = this.getFirstUser().id;
      window.logger.pLog(`Defaulting to create with first user`, userId);
    } else {
      window.logger.pLog(`Creating contract with user ${userId}`);
    }

    window.logger.in()
    const contract = createmarket({
      ...DEFAULT_CONTRACT_PARAMS,
      ...overrides,
      },
      userId,
    )
    window.logger.out()
    return this.addContract(contract);
  }


  private addContract(contract: Contract) {
    if (this.contracts[contract.id]) {
      window.logger.throw("PlaygroundError", `Contract ${contract.id} already exists`);
    }
    window.logger.pLog(`Saving contract "${contract.id}"`, contract);
    this.contracts[contract.id] = contract;
    return contract;
  }

  getContract(id: string) {
    return this.contracts[id];
  }

  getContractsByCreatorId(userId: string) {
    return Object.values(this.contracts).filter(contract => contract.creatorId === userId);
  }

  getLatestContract() {
    if (Object.values(this.contracts).length > 0)
      return Object.values(this.contracts).sort((a, b) => b.createdTime - a.createdTime)[0];

    window.logger.pLog("No contracts exist yet, creating a default contract");
    window.logger.in()
    const contract = this.addContractWithDefaultProps();
    window.logger.out()
    return contract
  }

  placeBetWithDefaultProps(body: any, userId?: string, isApi?: boolean) {
    if (!userId) {
      window.logger.pLog(`userId not specified, defaulting to first user for bet`);
      userId = this.getFirstUser().id;
    }
    if (! ('contractId' in body)) {
      window.logger.pLog("contractId not specified, defaulting to newest");
      const contract = this.getLatestContract();
      body.contractId = contract.id;
    }
    return placebet({
      ...DEFAULT_BINARY_BET_PARAMS,
      ...body
    }, userId, isApi); // in the course of running placebet, it will call the playground's addBet
  }

  addBet(bet: Bet) {
    if (bet.id === undefined) {
      bet.id = this.getNextId();
    }
    if (this.bets[bet.id]) {
      window.logger.throw("PlaygroundError", `Bet ${bet.id} already exists`);
    }
    this.bets[bet.id] = bet;
    return bet;
  }

  getBet(id: string) {
    return this.bets[id];
  }

  getBetsByContractId(contractId: string) {
    return Object.values(this.bets).filter(bet => bet.contractId === contractId);
  }

  getUnfilledBetsByContractId(contractId: string) {
    return (Object.values(this.bets) as LimitBet[]).filter(bet => bet.contractId === contractId
      && bet.isFilled === false
      && bet.isCancelled === false);
  }

  getBetsByAnswerId(answerId: string) {
    return Object.values(this.bets).filter(bet => bet.answerId === answerId);
  }

  getBetsByUserId(userId: string) {
    return Object.values(this.bets).filter(bet => bet.userId === userId);
  }

  getBetsByAnswerIdAndUserId(answerId: string, userId: string) {
    return Object.values(this.bets).filter(bet => bet.answerId === answerId && bet.userId === userId);
  }

  addTxn(txn: Txn) {
    if (this.txns[txn.id]) {
      window.logger.throw("PlaygroundError", `Txn ${txn.id} already exists`);
    }
    this.txns[txn.id] = txn;
  }

  getTxn(id: string) {
    return this.txns[id];
  }

  // runNewTransaction(a: { fromId: string; fromType: string; toId: string; toType: string; amount: number; token: string; category: string; }) {
  //   const txn = {
  //     id: this.getNextId(),
  //     createdTime: Date.now(),
  //     fromId: a.fromId,
  //     fromType: a.fromType,
  //     toId: a.toId,
  //     toType: a.toType,
  //     amount: a.amount,
  //     token: a.token,
  //     category: a.category
  //   } as Txn;

  //   if (txn.fromType === 'USER') {
  //     const user = this.getUser(txn.fromId);
  //     if (user) {
  //       if (user.balance < txn.amount) {
  //         window.logger.throw("PlaygroundError", `User ${user.id} has insufficient funds (${user.balance}) to handle transaction of ${txn.amount}`);
  //       }
  //       user.balance -= txn.amount;
  //     } else {
  //       window.logger.throw("PlaygroundError", `User ${txn.fromId} does not exist`);
  //     }
  //   }

  //   if (txn.fromType === 'BANK') {
  //     if (this.bank.balance < txn.amount) {
  //       window.logger.throw("PlaygroundError", `Bank has insufficient funds (${this.bank.balance}) to handle transaction of ${txn.amount}`);
  //     }
  //     this.bank.balance -= txn.amount;
  //   }

  //   if (txn.toType === 'USER') {
  //     const user = this.getUser(txn.toId);
  //     if (user) {
  //       user.balance += txn.amount;
  //     } else {
  //       window.logger.throw("PlaygroundError", `User ${txn.toId} does not exist`);
  //     }
  //   }



  //   this.addTxn(txn);

}
