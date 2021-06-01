// import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
// import { TokenAmount } from 'anyswap-sdk'
import { useTranslation } from 'react-i18next'
// import { ThemeContext } from 'styled-components'
// import { ArrowDown } from 'react-feather'

import SelectCurrencyInputPanel from '../../components/CurrencySelect/selectCurrency'

import { useActiveWeb3React } from '../../hooks'
import {useSwapUnderlyingCallback} from '../../hooks/useBridgeCallback'
import { WrapType } from '../../hooks/useWrapCallback'
import { useLocalToken } from '../../hooks/Tokens'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'

import { AutoColumn } from '../../components/Column'
// import SwapIcon from '../../components/SwapIcon'
import { BottomGrouping } from '../../components/swap/styleds'
import { ButtonLight, ButtonPrimary, ButtonConfirmed } from '../../components/Button'
import { AutoRow } from '../../components/Row'
import Loader from '../../components/Loader'
import Title from '../../components/Title'



import { tryParseAmount } from '../../state/swap/hooks'
import { useWalletModalToggle } from '../../state/application/hooks'

import config from '../../config'
import {getParams} from '../../config/getUrlParams'

import AppBody from '../AppBody'

import PoolTip from './poolTip'

import {getTokenConfig} from '../../utils/bridge/getBaseInfo'
import { isAddress } from '../../utils'

export default function SwapNative() {
  const { account, chainId } = useActiveWeb3React()
  // const { chainId } = useActiveWeb3React()
  // const account = '0x12139f3afa1C93303e1EfE3Df142039CC05C6c58'
  const { t } = useTranslation()
  // const selectedTokenList = useSelectedTokenList()
  // const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle()

  const urlSwapType = getParams('bridgetype') ? getParams('bridgetype') : 'deposit'

  const [inputBridgeValue, setInputBridgeValue] = useState('')
  const [selectCurrency, setSelectCurrency] = useState<any>()
  const [swapType, setSwapType] = useState<any>(urlSwapType)
  const [count, setCount] = useState<number>(0)
  const [bridgeConfig, setBridgeConfig] = useState<any>()

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  let initBridgeToken:any = getParams('bridgetoken') ? getParams('bridgetoken') : ''
  initBridgeToken = initBridgeToken && isAddress(initBridgeToken) ? initBridgeToken.toLowerCase() : ''

  

  const underlyingToken =  useMemo(() => {
    if (selectCurrency && selectCurrency.underlying) {
      return {
        address: selectCurrency.underlying.address,
        name: selectCurrency.underlying.name,
        symbol: selectCurrency.underlying.symbol,
        decimals: selectCurrency.underlying.decimals
      }
    }
    return
  }, [selectCurrency])
  // console.log(selectCurrency)
  const anyCurrency = useLocalToken(selectCurrency ?? undefined)
  const underlyingCurrency = useLocalToken(underlyingToken ?? undefined)
  // const amountToApprove = underlyingCurrency ? new TokenAmount(underlyingCurrency ?? undefined, inputBridgeValue) : undefined
  const formatInputBridgeValue = tryParseAmount(inputBridgeValue, underlyingCurrency ?? undefined)
  const [approval, approveCallback] = useApproveCallback(formatInputBridgeValue ?? undefined, selectCurrency?.address)

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useSwapUnderlyingCallback(
    swapType !== 'deposit' ? (anyCurrency ?? undefined) : (underlyingCurrency ?? undefined),
    selectCurrency?.address,
    inputBridgeValue,
    swapType
  )

  const isCrossBridge = useMemo(() => {
    if (
      account
      && selectCurrency
      && inputBridgeValue
      && !wrapInputError
    ) {
      return false
    } else {
      return true
    }
  }, [selectCurrency, account, wrapInputError, inputBridgeValue])

  const btnTxt = useMemo(() => {
    const bt = swapType !== 'deposit' ? t('RemoveLiquidity') : t('AddLiquidity')
    if (wrapInputError && inputBridgeValue) {
      return wrapInputError
    } else if (wrapInputError && !inputBridgeValue) {
      return bt
    } else if (wrapType === WrapType.WRAP) {
      return bt
    }
    return bt
  }, [t, wrapInputError, swapType])

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  useEffect(() => {
    const token = selectCurrency && selectCurrency.chainId === chainId ? selectCurrency.address : (initBridgeToken ? initBridgeToken : config.getCurChainInfo(chainId).bridgeInitToken)
    // console.log(token)
    if (token) {
      getTokenConfig(token, chainId).then((res:any) => {
        console.log(res)
        setBridgeConfig(res)
        if (res && res.decimals && res.symbol) {
          if (!selectCurrency || selectCurrency.chainId !== chainId) {
            setSelectCurrency({
              "address": token,
              "chainId": chainId,
              "decimals": res.decimals,
              "name": res.name,
              "symbol": res.symbol,
              "underlying": res.underlying,
              "destChain": res.destChain,
            })
          }
        } else {
          setTimeout(() => {
            setCount(count + 1)
            // setCount(1)
          }, 100)
          setBridgeConfig('')
        }
      })
    } else {
      setBridgeConfig('')
    }
    // getBaseInfo()
  }, [selectCurrency, count, chainId])

  const handleMaxInput = useCallback((value) => {
    if (value) {
      setInputBridgeValue(value)
    } else {
      setInputBridgeValue('')
    }
  }, [setInputBridgeValue])

  return (
    <>
      <AppBody>
        <Title
          title={t(swapType === 'deposit' ? 'Add' : 'Remove')}
          tabList={[
            {
              name: t('Add'),
              onTabClick: () => {
                setSwapType('deposit')
                setInputBridgeValue('')
              },
              iconUrl: require('../../assets/images/icon/deposit.svg'),
              iconActiveUrl: require('../../assets/images/icon/deposit-purple.svg')
            },
            {
              name: t('Remove'),
              onTabClick: () => {
                setSwapType('withdraw')
                setInputBridgeValue('')
              },
              iconUrl: require('../../assets/images/icon/withdraw.svg'),
              iconActiveUrl: require('../../assets/images/icon/withdraw-purple.svg')
            }
          ]}
          currentTab={swapType === 'deposit' ? 0 : 1}
        ></Title>
        <AutoColumn gap={'md'}>

          <SelectCurrencyInputPanel
            label={t('From')}
            value={inputBridgeValue}
            onUserInput={(value) => {
              setInputBridgeValue(value)
            }}
            onCurrencySelect={(inputCurrency) => {
              console.log(inputCurrency)
              setSelectCurrency(inputCurrency)
            }}
            onMax={(value) => {
              handleMaxInput(value)
            }}
            currency={swapType !== 'deposit' ? (anyCurrency ?? undefined) : (underlyingCurrency ?? undefined)}
            disableCurrencySelect={false}
            showMaxButton={true}
            id="selectCurrency"
            inputType={{swapType, type: 'INPUT'}}
            onlyUnderlying={true}
          />

        </AutoColumn>

        <PoolTip 
          anyCurrency={anyCurrency}
          bridgeConfig={bridgeConfig}
        />

        <BottomGrouping>

          {!account ? (
              <ButtonLight onClick={toggleWalletModal}>{t('ConnectWallet')}</ButtonLight>
            ) : (
              inputBridgeValue && (approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING)? (
                <ButtonConfirmed
                  onClick={approveCallback}
                  disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                  width="48%"
                  altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                  // confirmed={approval === ApprovalState.APPROVED}
                >
                  {approval === ApprovalState.PENDING ? (
                    <AutoRow gap="6px" justify="center">
                      {t('Approving')} <Loader stroke="white" />
                    </AutoRow>
                  ) : approvalSubmitted ? (
                    t('Approved')
                  ) : (
                    t('Approve') + ' ' + config.getBaseCoin(anyCurrency?.symbol)
                  )}
                </ButtonConfirmed>
              ) : (
                <ButtonPrimary disabled={isCrossBridge} onClick={onWrap}>
                  {btnTxt}
                </ButtonPrimary>
              )
            )
          }
        </BottomGrouping>

      </AppBody>
    </>
  )
}