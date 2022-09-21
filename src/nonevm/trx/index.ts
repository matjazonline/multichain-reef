import { useCallback, useMemo } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
// import useInterval from "../useInterval"
import { MaxUint256 } from '@ethersproject/constants'
import { AppState, AppDispatch } from '../../state'
import { trxAddress } from './actions'
import { useActiveReact } from '../../hooks/useActiveReact'

import {useBaseBalances, useTokensBalance} from '../../hooks/useAllBalances'

import { tryParseAmount3 } from '../../state/swap/hooks'
import { ChainId } from "../../config/chainConfig/chainId"


import {recordsTxns} from '../../utils/bridge/register'
import {useTxnsDtilOpen, useTxnsErrorTipOpen} from '../../state/application/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
// import { BigAmount } from "../../utils/formatBignumber"
import { isAddress } from '../../utils/isAddress'

import {
  // ABI_TO_ADDRESS,
  ABI_TO_STRING,
  POOL_ABI,
  ERC20_ABI
} from './crosschainABI'
import {VALID_BALANCE} from '../../config/constant'
import config from '../../config'
// import useInterval from "../useInterval"
// const tronweb = window.tronWeb

import TronWeb from 'tronweb'
// console.log(TronWeb)
export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
  NOCONNECT
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }

export function initTronWeb (chainId?:any) {
  let fullNode = 'https://api.shasta.trongrid.io';
  let solidityNode = 'https://api.shasta.trongrid.io';
  let eventServer = 'https://api.shasta.trongrid.io';
  if (chainId === ChainId.TRX) {
    fullNode = 'https://api.trongrid.io';
    solidityNode = 'https://api.trongrid.io';
    eventServer = 'https://api.trongrid.io';
  }
  const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer
  );
  return tronWeb
}

export function toHexAddress (address:string) {
  const tronWeb = initTronWeb()
  const str = tronWeb?.address?.toHex(address).toLowerCase()
  return '0x' + str.substr(2)
}

export function fromHexAddress (address:string) {
  return '41' + address.substr(2)
}

export function isTRXAddress (address:string) {
  const tronWeb = initTronWeb()
  if (address.indexOf('0x') === 0) {
    address = address.replace('0x', '41')
  }
  return tronWeb?.isAddress(address)
}

export function formatTRXAddress (address:string) {
  const tronWeb = initTronWeb()
  if (address.indexOf('0x') === 0) {
    address = address.replace('0x', '41')
    address = tronWeb?.address.fromHex(address)
  }
  return address
}

export function useTrxAddress () {
  const account:any = useSelector<AppState, AppState['trx']>(state => state.trx.trxAddress)
  // console.log(window?.tronWeb?.isConnected())
  return {
    // trxAddress: account ? toHexAddress(account) : ''
    trxAddress: account
  }
}

export function useLoginTrx () {
  const dispatch = useDispatch<AppDispatch>()
  const loginTrx = useCallback(() => {
    // window.open('tronlinkoutside://pull.activity?param={}')
    if (window.tronWeb) {
      window.tronWeb.request({method: 'tron_requestAccounts'}).then((res:any) => {
        if (res?.code === 200) {
          dispatch(trxAddress({address: window.tronWeb.defaultAddress.base58}))
        } else {
          dispatch(trxAddress({address: ''}))
          alert('Please connect TronLink.')
        }
      }).catch((err:any) => {
        console.log(err)
        dispatch(trxAddress({address: ''}))
        alert('Please connect TronLink.')
      })
    } else {
      if (confirm('Please open TronLink or install TronLink.') === true) {
        window.open('https://www.tronlink.org/')
      }
    }
  }, [])
  return {
    loginTrx
  }
}

export function useTrxBalance () {
  const TRXAccount = window?.tronWeb?.defaultAddress?.base58
  const getTrxBalance = useCallback(({account}) => {
    return new Promise((resolve) => {
      const useAccount = account ? account : TRXAccount
      if (window.tronWeb && window.tronWeb.defaultAddress.base58 && useAccount) {
        window?.tronWeb?.trx.getBalance(useAccount).then((res:any) => {
          // console.log(res)
          resolve(res)
        })
      } else {
        resolve('')
      }
    })
  }, [TRXAccount]) 

  const getTrxTokenBalance = useCallback(({account, token}) => {
    return new Promise((resolve) => {
      const useAccount = account ? account : TRXAccount
      const parameter1 = [{type:'address',value: useAccount}]
      const tokenID = fromHexAddress(token)
      // console.log('tokenID', tokenID)
      if (window.tronWeb && window.tronWeb.defaultAddress.base58 && useAccount && tokenID) {
        window?.tronWeb?.transactionBuilder.triggerSmartContract(tokenID, "balanceOf(address)", {}, parameter1, useAccount).then((res:any) => {
          // console.log(res)
          resolve(res)
        })
      } else {
        resolve('')
      }
    })
  }, [TRXAccount])

  return {
    getTrxBalance,
    getTrxTokenBalance
  }
}

export function useTrxAllowance(
  selectCurrency:any,
  spender: any,
  chainId: any,
  account: any,
) {
  // const {chainId} = useActiveReact()
  // const dispatch = useDispatch<AppDispatch>()
  // const tal:any = useSelector<AppState, AppState['trx']>(state => state.trx.trxApproveList)
  // const TRXAccount = useTrxAddress()
  // const addTransaction = useTransactionAdder()
  // const [allowance, setAllowance] = useState<any>()

  const setTrxAllowance = useCallback(({token, spender}): Promise<any> => {
    return new Promise(async(resolve, reject) => {
      const useAccount = account
      // console.log(token)
      // console.log(spender)
      // console.log(useAccount)
      // console.log(chainId)
      if (!token || !spender || !useAccount || ![ChainId.TRX, ChainId.TRX_TEST].includes(chainId)) resolve('')
      else {
        const tokenID = fromHexAddress(token)
        const spenderID = fromHexAddress(spender)
        if (window.tronWeb && window.tronWeb.defaultAddress.base58 && useAccount && tokenID) {
          try {
            // console.log(tokenID)
            const instance:any = await window?.tronWeb?.contract(ERC20_ABI, tokenID)
            const result  = await instance.approve(spenderID, MaxUint256.toString()).send()
            // const result  = await instance.approve(spenderID, 0).send()
            // console.log(result)
            // console.log(MaxUint256)
            const txObj:any = {hash: result}
            // addTransaction(txObj, {
            //   summary: selectCurrency?.symbol + ' approved, you can continue the cross chain transaction',
            //   approval: { tokenAddress: token.address, spender: spender }
            // })
            resolve(txObj)
          } catch (error) {
            console.log(error)
            reject(error)
          }
        } else {
          resolve('')
        }
      }
    })
  }, [spender, account, chainId])

  const getTrxAllowance = useCallback(() => {
    return new Promise(async(resolve) => {
      const useAccount = account
      if (!selectCurrency?.address || !spender || !useAccount || ![ChainId.TRX, ChainId.TRX_TEST].includes(chainId)) resolve('')
      else {
        // const parameter1 = [{type:'address',value: useAccount}, {type:'address',value: spender}]
        const tokenID = formatTRXAddress(selectCurrency?.address)
        // console.log('tokenID', tokenID)
        // console.log('parameter1', parameter1)
        if (window.tronWeb && window.tronWeb.defaultAddress.base58 && useAccount && tokenID) {
          const instance:any = await window?.tronWeb?.contract(ERC20_ABI, tokenID)
          const result  = await instance.allowance(useAccount, spender).call()
          // console.log(result.toString())
          resolve(result.toString())
        } else {
          resolve('')
        }
      }
    })
  }, [account, chainId, selectCurrency, spender])

  // useEffect(() => {
  //   getTrxAllowance().then(res => {
  //     // console.log(res)
  //     // setAllowance(res)
  //     dispatch(trxApproveList({token: selectCurrency?.address, result: res}))
  //   })
  // }, [selectCurrency, TRXAccount])

  // useInterval(getTrxAllowance, 10000)

  return {
    setTrxAllowance,
    getTrxAllowance,
    // trxAllowance: tal?.[selectCurrency?.address]
  }
}

export function getTRXTxnsStatus (txid:string) {
  return new Promise(resolve => {
    const data:any = {}
    if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
      // window?.tronWeb?.trx.getTransaction(txid).then((res:any) => {
      window?.tronWeb?.trx.getTransactionInfo(txid).then((res:any) => {
        console.log(res)
        if (res?.receipt?.result === 'SUCCESS') {
          data.msg = 'Success'
          data.info = res
        } else if (res?.receipt?.result && res?.receipt?.result !== 'SUCCESS') {
          data.msg = 'Failure'
          data.error = 'Txns is failure!'
        } else {
          data.msg = 'Null'
          data.error = 'Txns is failure!'
        }
        resolve(data)
      })
    } else {
      data.msg = 'Null'
      data.error = 'Txns is failure!'
      resolve(data)
    }
  })
}


export function useTrxCrossChain (
  routerToken: any,
  inputToken: any,
  chainId:any,
  selectCurrency:any,
  selectChain:any,
  receiveAddress:any,
  typedValue:any,
  destConfig:any,
): {
  inputError?: string
  balance?: any,
  execute?: undefined | (() => Promise<void>)
} {
  const {account} = useActiveReact()
  const { t } = useTranslation()
  const {onChangeViewDtil} = useTxnsDtilOpen()
  const {onChangeViewErrorTip} = useTxnsErrorTipOpen()
  const addTransaction = useTransactionAdder()

  const nativeBalance = useBaseBalances(account)
  const tokenBalance = useTokensBalance(selectCurrency?.address, selectCurrency?.decimals, chainId)
  const balance = selectCurrency?.tokenType === 'NATIVE' ? nativeBalance : tokenBalance

  // const [balance, setBalance] = useState<any>()

  // const {getTrxBalance, getTrxTokenBalance} = useTrxBalance()

  const inputAmount = useMemo(() => tryParseAmount3(typedValue, selectCurrency?.decimals), [typedValue, selectCurrency])

  let sufficientBalance = false
  try {
    // sufficientBalance = true
    sufficientBalance = selectCurrency && typedValue && balance && (Number(balance?.toExact()) >= Number(typedValue))
  } catch (error) {
    console.log(error)
  }

  return useMemo(() => {
    if (!account || ![ChainId.TRX, ChainId.TRX_TEST].includes(chainId) || !routerToken) return {}
    return {
      balance: balance,
      execute: async () => {
        // let contract = await window?.tronWeb?.contract()
        if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
          const TRXAccount = window?.tronWeb?.defaultAddress.base58
          const formatRouterToken = fromHexAddress(routerToken)
          const formatInputToken = fromHexAddress(inputToken)
          // console.log('formatRouterToken',formatRouterToken)
          // console.log('formatInputToken',formatInputToken)
          // const formatReceiveAddress = formatTRXAddress(receiveAddress)
          const formatReceiveAddress = receiveAddress
          if (TRXAccount.toLowerCase() === account.toLowerCase()) {
            let txResult:any = ''
            // const instance:any = await window?.tronWeb?.contract(isNaN(selectChain) ? ABI_TO_ADDRESS : ABI_TO_STRING, formatRouterToken)
            const instance:any = await window?.tronWeb?.contract(ABI_TO_STRING, formatRouterToken)
            try {
              if (destConfig.routerABI.indexOf('anySwapOutNative') !== -1) { // anySwapOutNative
                txResult = await instance.anySwapOutNative(...[formatInputToken, formatReceiveAddress, selectChain], {value: inputAmount}).send()
              } else if (destConfig.routerABI.indexOf('anySwapOutUnderlying') !== -1) { // anySwapOutUnderlying
                const parameArr = [formatInputToken, formatReceiveAddress, inputAmount, selectChain]
                console.log(parameArr)
                txResult = await instance.anySwapOutUnderlying(...parameArr).send()
              } else if (destConfig.routerABI.indexOf('anySwapOut') !== -1) { // anySwapOut
                const parameArr = [formatInputToken, formatReceiveAddress, inputAmount, selectChain]
                console.log(parameArr)
                txResult = await instance.anySwapOut(...parameArr).send()
              }
              const txReceipt:any = {hash: txResult}
              console.log(txReceipt)
              if (txReceipt?.hash) {
                const data:any = {
                  hash: txReceipt.hash,
                  chainId: chainId,
                  selectChain: selectChain,
                  account: TRXAccount,
                  value: inputAmount,
                  formatvalue: typedValue,
                  to: receiveAddress,
                  symbol: selectCurrency?.symbol,
                  version: destConfig.type,
                  pairid: selectCurrency?.symbol,
                  routerToken: routerToken
                }
                addTransaction(txReceipt, {
                  summary: `Cross bridge ${typedValue} ${selectCurrency?.symbol}`,
                  value: typedValue,
                  toChainId: selectChain,
                  toAddress: receiveAddress.indexOf('0x') === 0 ? receiveAddress?.toLowerCase() : receiveAddress,
                  symbol: selectCurrency?.symbol,
                  version: destConfig.type,
                  routerToken: routerToken,
                  token: selectCurrency?.address,
                  logoUrl: selectCurrency?.logoUrl,
                  isLiquidity: destConfig?.isLiquidity,
                  fromInfo: {
                    symbol: selectCurrency?.symbol,
                    name: selectCurrency?.name,
                    decimals: selectCurrency?.decimals,
                    address: selectCurrency?.address,
                  },
                  toInfo: {
                    symbol: destConfig?.symbol,
                    name: destConfig?.name,
                    decimals: destConfig?.decimals,
                    address: destConfig?.address,
                  },
                })
                recordsTxns(data)
                onChangeViewDtil(txReceipt?.hash, true)
              }
            } catch (error) {
              console.log(error);
              onChangeViewErrorTip('Txns failure.', true)
            }
          }
        } else {
          onChangeViewErrorTip('Please install TronLink.', true)
        }
      },
      inputError: sufficientBalance ? undefined : t('Insufficient', {symbol: selectCurrency?.symbol})
    }
  }, [receiveAddress, account, selectCurrency, inputAmount, chainId, routerToken, selectChain, destConfig, inputToken, balance])
}


export function useTrxSwapPoolCallback(
  inputCurrency: any,
  inputToken: string | undefined,
  typedValue: string | undefined,
  swapType: string | undefined,
// ): { execute?: undefined | (() => Promise<void>); inputError?: string } {
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { account, chainId } = useActiveReact()
  const {onChangeViewErrorTip} = useTxnsErrorTipOpen()
  const { t } = useTranslation()
  // console.log(balance)
  // console.log(inputCurrency)
  const inputAmount = useMemo(() => tryParseAmount3(typedValue, inputCurrency?.decimals), [inputCurrency, typedValue])
  const addTransaction = useTransactionAdder()

  const nativeBalance = useBaseBalances(account)
  const tokenBalance = useTokensBalance(inputCurrency?.address, inputCurrency?.decimals, chainId)
  const balance = inputCurrency?.tokenType === 'NATIVE' ? nativeBalance : tokenBalance
  
  return useMemo(() => {
    // console.log(routerToken)
    // console.log(bridgeContract)
    // console.log(chainId)
    // console.log(inputCurrency)
    // console.log(swapType)
    // console.log(balance)
    // console.log(inputAmount)
    if (!chainId || !inputCurrency || !swapType) return NOT_APPLICABLE
    // console.log(typedValue)

    const sufficientBalance = typedValue && balance && (Number(balance?.toExact()) >= Number(typedValue))
    // console.log(sufficientBalance)
    return {
      wrapType: WrapType.WRAP,
      execute:
      (sufficientBalance || !VALID_BALANCE) && inputAmount
        ? async () => {
            try {
              if (window.tronWeb && window.tronWeb.defaultAddress.base58 && inputToken) {
                // console.log(123)
                // console.log(inputToken)
                const instance:any = await window?.tronWeb?.contract(POOL_ABI, fromHexAddress(inputToken))
                // console.log(instance)
                const txResult = swapType === 'deposit' ? await instance.deposit(inputAmount).send() : await instance.withdraw(inputAmount).send()
                const txReceipt:any = {hash: txResult}
                console.log(txReceipt)
                addTransaction(txReceipt, { summary: `${swapType === 'deposit' ? 'Deposit' : 'Withdraw'} ${typedValue} ${config.getBaseCoin(inputCurrency?.symbol, chainId)}` })
              } else {
                console.log('Could not swapout')
              }
            } catch (error) {
              console.log('Could not swapout', error)
              onChangeViewErrorTip(error, true)
            }
          }
        : undefined,
      inputError: sufficientBalance ? undefined : t('Insufficient', {symbol: inputCurrency?.symbol})
    }
  }, [chainId, inputCurrency, inputAmount, balance, addTransaction, t, inputToken, account])
}


export function useTrxPoolDatas () {
  const getTrxPoolDatas = useCallback(async(calls, chainId) => {
    return new Promise(resolve => {
      const arr = []
      const labelArr:any = []
      // console.log(calls)
      if (window.tronWeb && [ChainId.TRX, ChainId.TRX_TEST].includes(chainId) ) {
        // console.log(calls)
        // const useAccount = window.tronWeb.defaultAddress.base58
        for (const item of calls) {
          const anytoken = item.anytoken ? fromHexAddress(item.anytoken) : ''
          const anytokenSource = item.anytoken
          // const anytoken = item.anytoken ? toHexAddress(item.anytoken) : ''
          // const anytoken = item.anytoken
          // const underlyingToken = item.token
          const underlyingToken = item.token ? fromHexAddress(item.token) : ''
          // console.log('anytoken', anytoken)
          // console.log('underlyingToken', underlyingToken)
          if (underlyingToken && anytoken) {
            // console.log(underlyingToken, anytoken)
            // arr.push(window?.tronWeb?.transactionBuilder.triggerSmartContract(underlyingToken, "balanceOf(address)", {}, {type:'address',value: anytoken}, useAccount))
            arr.push(window?.tronWeb?.contract(ERC20_ABI, underlyingToken).balanceOf(anytoken).call())
            // arr.push(window?.tronWeb?.transactionBuilder.triggerSmartContract(underlyingToken, "balanceOf(address)", {}, {type:'address',value: anytoken}, useAccount))
            labelArr.push({
              key: anytokenSource,
              label: 'balanceOf'
            })
            // arr.push(window?.tronWeb?.transactionBuilder.triggerSmartContract(underlyingToken, "totalSupply()", {}, {}, useAccount))
            arr.push(window?.tronWeb?.contract(ERC20_ABI, underlyingToken).totalSupply().call())
            labelArr.push({
              key: anytokenSource,
              label: 'totalSupply'
            })
          }
          
          if (anytoken && isAddress(item.account, chainId)) {
            // arr.push(window?.tronWeb?.transactionBuilder.triggerSmartContract(anytoken, "balanceOf(address)", {}, {type:'address',value: item.account}, useAccount))
            arr.push(window?.tronWeb?.contract(ERC20_ABI, anytoken).balanceOf(item.account).call())
            labelArr.push({
              key: anytokenSource,
              label: 'balance'
            })
          }
        }
      }
      // console.log(arr)
      Promise.all(arr).then(res => {
        // console.log(res)
        const list:any = {}
        for (let i = 0, len = arr.length; i < len; i++) {
          const k = labelArr[i].key
          const l = labelArr[i].label
          if (!list[k]) list[k] = {}
          list[k][l] = res[i].toString()
        }
        // console.log(list)
        resolve(list)
      })
    })
  }, [])

  return {
    getTrxPoolDatas,
  }
}