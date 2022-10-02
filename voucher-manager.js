import useLocalStorage from "use-local-storage";
import {useEffect, useState} from 'react';

export default function VoucherManager() {
  const [voucherBlackList, setVoucherBlackList] = useLocalStorage("voucherblacklist", []);

  const addVoucherToBlackList = (voucher) => {
    setVoucherBlackList([...JSON.parse(localStorage.getItem("voucherblacklist")), voucher])
  }

  const removeVoucherFromBlackList = (tokenId) => {
    const newVoucherBlackList = JSON.parse(localStorage.getItem("voucherblacklist")).filter((voucher) => voucher.tokenId !== tokenId) 
    setVoucherBlackList(newVoucherBlackList)
  }

  const checkBlackList = () => {
    const newVoucherBlackList = JSON.parse(localStorage.getItem("voucherblacklist")).filter((voucher) => {
            return voucher.expiry > Math.round(new Date().getTime() / 1000)
        }
    )
    if(voucherBlackList !== newVoucherBlackList) {
        setVoucherBlackList(newVoucherBlackList)
    }
  }

//   useEffect(() => {
//     const interval = setInterval(() => {
//         const newVoucherBlackList = JSON.parse(localStorage.getItem("voucherblacklist")).filter((voucher) => {
//                 return voucher.expiry > Math.round(new Date().getTime() / 1000)
//             }
//         )
//         if(voucherBlackList !== newVoucherBlackList) {
//             setVoucherBlackList(newVoucherBlackList)
//         }
//     }, 1000)
//     return () => {
//         clearInterval(interval);
//     };
//   }, [])

  return {
    voucherBlackList,
    addVoucherToBlackList,
    removeVoucherFromBlackList,
    checkBlackList
  };
}

export {
    VoucherManager
}