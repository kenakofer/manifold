// Class for representing the global state of the playground, including a
// dictionary of users and contracts and the bank. The intention is that
// anywhere a db connection is made to save data in the original code, we'll
// replace that with transient storage in the playground state.
import { NestedLogger } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; } }

import { Contract } from "../contract";
import { User } from "../user";
import { Bet, LimitBet } from "../bet";

const deposit_exempt_categories: string[] = [
  'BUY_SHARES',
  'SELL_SHARES',
  'RESOLUTION_PAYOUT',
]


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
  private users: { [key: string]: User };
  private contracts: { [key: string]: Contract };
  private bets: { [key: string]: Bet };
  private txns: { [key: string]: Txn };
  private id_index: number;

  constructor() {
    this.users = {};
    this.contracts = {};
    this.bets = {};
    this.txns = {};
    this.bank = {
      id: "bank",
      balance: 100000,
    };
    this.id_index = 0;
  }

  getNextId() {
    return "" + this.id_index++;
  }

  addUser(user: User) {
    if (this.users[user.id]) {
      window.logger.throw("PlaygroundError", `User ${user.id} already exists`);
    }
    this.users[user.id] = user;
  }

  getUser(id: string) {
    return this.users[id];
  }

  addContract(contract: Contract) {
    if (this.contracts[contract.id]) {
      window.logger.throw("PlaygroundError", `Contract ${contract.id} already exists`);
    }
    this.contracts[contract.id] = contract;
  }

  getContract(id: string) {
    return this.contracts[id];
  }

  getContractsByCreatorId(userId: string) {
    return Object.values(this.contracts).filter(contract => contract.creatorId === userId);
  }

  addBet(bet: Bet) {
    if (this.bets[bet.id]) {
      window.logger.throw("PlaygroundError", `Bet ${bet.id} already exists`);
    }
    this.bets[bet.id] = bet;
  }

  getBet(id: string) {
    return this.bets[id];
  }

  getBetsByContractId(contractId: string) {
    return Object.values(this.bets).filter(bet => bet.contractId === contractId);
  }

  getUnfilledBetsByContractId(contractId: string) {
    return Object.values(this.bets).filter(bet => bet.contractId === contractId
      && (bet as LimitBet).isFilled === false) as LimitBet[];
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
