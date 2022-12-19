import {useCallback, useMemo} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {AppDispatch, AppState} from '../../state'
import {tempAddress} from './actions'
import {useActiveReact} from '../../hooks/useActiveReact'
import {REEF_EXTENSION_IDENT} from "@reef-defi/extension-inject";
import {web3Enable} from "@reef-defi/extension-dapp";
import {ReefInjected} from "@reef-defi/extension-inject/types";
import {resolveAddress, resolveEvmAddress} from "@reef-defi/evm-provider/utils";
import {Contract} from "@ethersproject/contracts";
import {ERC20_ABI} from "../../constants/abis/erc20";

let reefExtension: ReefInjected;

async function getReefBalance(address: string ): Promise<string> {
  const provider = await reefExtension.reefProvider.getNetworkProvider();
  const substrateAddr = await resolveAddress(provider, address);
  const {data:balance} = await provider.api.query.system.account(substrateAddr);
  return balance.free.toString();
}

export function isTempAddress (address:string):boolean | string {
  return address //true: address; false: false
}

export function useTempAddress () {
  const account:any = useSelector<AppState, AppState['temp']>(state => state.temp.tempAddress)
  return {
    tempAddress: account
  }
}


/**
 * Connect wallet and get account address
 */
export function useLoginTemp () {
  const dispatch = useDispatch<AppDispatch>()
  const loginTemp = useCallback(async () => {
    const appName = 'Multichain Bridge App'
    const extensionsArr = await web3Enable(appName);
    reefExtension = extensionsArr.find(e=>e.name===REEF_EXTENSION_IDENT) as ReefInjected;

    reefExtension.reefSigner.subscribeSelectedAccount(
        (account) => {
          if (!account) {
            return;
          }
          dispatch(tempAddress({address: account?.address}));
        }
    );
  }, [])
  return {
    loginTemp
  }
}

/**
 * Get native balance and token balance
 *
 * @param account wallet address
 * @param token token address
 */
export function useTempBalance () {
  const getTempBalance = useCallback(({account}: {account:string|null|undefined}) => {
    return new Promise((resolve) => {
      if (account) {
        resolve(await getReefBalance(account))
      }
    })
  }, [])

  const getTempTokenBalance = useCallback(({account, token}: {account:string|null|undefined, token:string|null|undefined}) => {
    return new Promise((resolve) => {
      if (account && token) {
        const provider = await reefExtension.reefProvider.getNetworkProvider();
        const token = new Contract(token, ERC20_ABI, provider);
        const evmAddr = await resolveEvmAddress(provider, account);
        if(evmAddr) {
          const balance = await token.balanceOf(evmAddr);
          resolve(balance);
        }
      }
    })
  }, [])

  return {
    getTempBalance,
    getTempTokenBalance
  }
}

/**
 * Authorization and obtaining authorization information
 *
 * @param account wallet address
 * @param token token address
 * @param spender spender address
 */
export function useTempAllowance(
  token: string | null | undefined,
  spender: string | null | undefined,
  chainId: string | null | undefined,
  account: string | null | undefined,
) {
  const setTempAllowance = useCallback((): Promise<any> => {
    return new Promise(async(resolve, reject) => {
      if (token && spender && account && chainId) {
        resolve('')
      } else {
        reject('')
      }
    })
  }, [token, spender, account, chainId])

  const getTempAllowance = useCallback(() => {
    return new Promise(async(resolve): Promise<any> => {
      resolve('')
    })
  }, [account, chainId, token, spender])

  return {
    setTempAllowance,
    getTempAllowance,
  }
}

enum State {
  Success = 'Success',
  Failure = 'Failure',
  Null = 'Null',
}

interface TxDataResult {
  msg: State,
  info: any,
  error: any
}
/**
 * Get transaction info
 *
 * @param txid transaction hash
 */
export function getTempTxnsStatus (txid:string) {
  return new Promise(resolve => {
    const data:TxDataResult = {
      msg: State.Null,
      info: '',
      error: ''
    }
    if (txid) {
      resolve(data)
    }
  })
}

/**
 * Cross chain
 *
 * @param routerToken router token address
 * @param inputToken any or underlying address
 * @param selectCurrency select current token info
 * @param selectChain to chainId
 * @param receiveAddress receive address
 * @param typedValue typed Value
 * @param destConfig to chain info
 */
export function useTempCrossChain (
  routerToken: string | null | undefined,
  inputToken: string | null | undefined,
  selectCurrency: any,
  selectChain: string | null | undefined,
  receiveAddress: string | null | undefined,
  typedValue: string | null | undefined,
  destConfig: any,
): {
  inputError?: string
  balance?: any,
  execute?: undefined | (() => Promise<void>)
} {
  const { account, chainId } = useActiveReact()
  return useMemo(() => {
    return {
      balance: '',
      execute: async () => {

      },
      inputError: ''
    }
  }, [routerToken, inputToken, chainId, selectCurrency, selectChain, receiveAddress, typedValue, destConfig, account])
}

enum SwapType {
  withdraw = 'withdraw',
  deposit = 'deposit',
}

/**
 * Cross chain
 *
 * @param routerToken router token address
 * @param selectCurrency select current token info
 * @param inputToken any or underlying address
 * @param typedValue typed Value
 * @param swapType deposit or withdraw
 * @param selectChain to chainId
 * @param receiveAddress receive address
 * @param destConfig to chain info
 */
export function useTempSwapPoolCallback(
  routerToken: string | null | undefined,
  selectCurrency: string | null | undefined,
  inputToken: string | null | undefined,
  typedValue: string | null | undefined,
  swapType: SwapType,
  selectChain: string | null | undefined,
  receiveAddress: string | null | undefined,
  destConfig: any,
): { execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { account, chainId } = useActiveReact()
  return useMemo(() => {
    return {
      balance: '',
      execute: async () => {

      },
      inputError: ''
    }
  }, [routerToken, inputToken, swapType, selectCurrency, selectChain, receiveAddress, typedValue, destConfig, account, chainId])
}

interface PoolCalls {
  token: string | null | undefined,
  account: string | null | undefined,
  anytoken: string | null | undefined,
  dec: number
}

interface PoolResult {
  [key:string]: {
    balanceOf: string,
    totalSupply: string,
    balance: string,
  }
}

/**
 * Get pool info
 *
 * @param chainId router token address
 * @param calls [{token: '', anytoken: '', account: ''}]
 * @return {'anytoken': {'balanceOf': '', 'totalSupply': '', 'balance': ''}}
 */
export function useTempPoolDatas () {
  const getTempPoolDatas = useCallback(async(calls: Array<[PoolCalls]>, chainId: string | null | undefined): Promise<PoolResult> => {
    return {
      'anytoken': {
        balanceOf: '',
        totalSupply: '',
        balance: '',
      }
    }
  }, [])
  return {
    getTempPoolDatas
  }
}
