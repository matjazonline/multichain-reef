import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useActiveWeb3React } from '../../hooks'

import TokenLogo from '../../components/TokenLogo'
import Title from '../../components/Title'

import AppBody from '../AppBody'

import {getAllToken} from '../../utils/bridge/getBaseInfo'
import {getGroupTotalsupply} from '../../utils/bridge/getBalance'
import {
  DBTables,
  DBThead,
  DBTh,
  DBTbody,
  DBTd,
  TokenTableCoinBox,
  TokenTableLogo,
  TokenNameBox,
  MyBalanceBox,
  TokenActionBtn,
  Flex
} from '../Dashboard'

import config from '../../config'

export default function PoolLists ({

}) {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()

  const [poolData, setPoolData] = useState<any>()
  const [poolList, setPoolList] = useState<any>()

  async function getOutChainInfo (destList:any) {
    const list:any = {}
    for (const chainID in destList) {
      list[chainID] = await getGroupTotalsupply(destList[chainID], chainID, account)
    }
    setPoolData(list)
    console.log(list)
    return list
  }
  // console.log(poolData)

  useEffect(() => {
    getAllToken(chainId).then((res:any) => {
      if (res) {
        // console.log(res)
        // const list:any = []
        const destList:any = {}
        const allToken = []
        for (const token in res) {
          const tObj = res[token].list
          if (tObj.underlying) {
            if (chainId) {
              if (!destList[chainId]) destList[chainId] = []
              destList[chainId].push({token: token, dec: tObj.decimals})
            }
            for (const chainID in tObj.destChain) {
              if (!destList[chainID]) destList[chainID] = []
              destList[chainID].push({token: tObj.destChain[chainID], dec: tObj.decimals})
              // console.log(chainID)
            }
            // console.log(Object.keys(tObj.destChain))
            allToken.push({
              ...tObj,
              token: token
            })
          }
        }
        // console.log(destList)
        setPoolList(allToken)
        getOutChainInfo(destList)
      }
    })
  }, [chainId])

  function viewTd (item:any, c?:any) {
    if (c) {
      const ts = c && poolData && poolData[c] && item.token && poolData[c][item.token] && poolData[c][item.token].ts ? poolData[c][item.token].ts : '0.00'
      const bl = c && poolData && poolData[c] && item.token && poolData[c][item.token] && poolData[c][item.token].balance ? poolData[c][item.token].balance : '0.00'
      return (
        <DBTd className='c'>
          {bl}/{ts}
        </DBTd>
      )
    }
    return Object.keys(poolList[0].destChain).map((chainID:any, indexs:any) => {
      const ts = poolData && poolData[chainID] && poolData[chainID][item.destChain[chainID]] && poolData[chainID][item.destChain[chainID]].ts ? poolData[chainID][item.destChain[chainID]].ts : '0.00'
      const bl = poolData && poolData[chainID] && poolData[chainID][item.destChain[chainID]] && poolData[chainID][item.destChain[chainID]].balance ? poolData[chainID][item.destChain[chainID]].balance : '0.00'
      return (
        <DBTd key={indexs} className='c'>
          {bl}/{ts}
        </DBTd>
      )
    })
  }
  return (
    <AppBody>
      <Title title={t('pool')}></Title>
      <MyBalanceBox>

        <DBTables>
          <DBThead>
            <tr>
              <DBTh className="c">{t('Coins')}</DBTh>
              {
                poolList && poolList.length > 0 ? (
                  <>
                    <DBTh>{config.getCurChainInfo(chainId).symbol}</DBTh>
                    {
                      Object.keys(poolList[0].destChain).map((item:any, index:any) => {
                        return (
                          <DBTh key={index}>{config.getCurChainInfo(item).symbol}</DBTh>
                        )
                      })
                    }
                  </>
                ) : (
                  <DBTh>{config.getCurChainInfo(chainId).symbol}</DBTh>
                )
              }
              <DBTh className="c">{t('Action')}</DBTh>
            </tr>
          </DBThead>
          <DBTbody>
            {
              poolList && poolList.length > 0 ? (
                poolList.map((item:any, index:any) => {
                  return (
                    <tr key={index}>
                      <DBTd width={'150'}>
                        <TokenTableCoinBox>
                          <TokenTableLogo>
                            <TokenLogo
                              symbol={config.getBaseCoin(item?.underlying?.symbol ? item?.underlying?.symbol : item?.symbol)}
                              size={'1.625rem'}
                            ></TokenLogo>
                          </TokenTableLogo>
                          <TokenNameBox>
                            <h3>{config.getBaseCoin(item?.underlying?.symbol ? item?.underlying?.symbol : item?.symbol)}</h3>
                            <p>{config.getBaseCoin(item?.underlying?.name ? item?.underlying?.name : item?.name, 1)}</p>
                          </TokenNameBox>
                        </TokenTableCoinBox>
                      </DBTd>
                      {viewTd(item, chainId)}
                      {viewTd(item)}
                      <DBTd className="c" width={'180'}>
                        <Flex>
                          <TokenActionBtn to={'/pool/add?bridgetoken=' + item?.token + '&bridgetype=deposit'}>{t('bridge')}</TokenActionBtn>
                          <TokenActionBtn to={'/pool/add?bridgetoken=' + item?.token + '&bridgetype=withdraw'}>{t('withdraw')}</TokenActionBtn>
                        </Flex>
                      </DBTd>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <DBTd></DBTd>
                  <DBTd></DBTd>
                  <DBTd></DBTd>
                </tr>
              )
            }
          </DBTbody>
        </DBTables>
      </MyBalanceBox>
    </AppBody>
  )
}