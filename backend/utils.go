package main

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/klaytn/klaytn/accounts/abi"
	"github.com/klaytn/klaytn/common"
	"github.com/klaytn/klaytn/common/hexutil"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
)

var httpClient = &http.Client{}

func Encode(b []byte) string {
	enc := make([]byte, len(b)*2)
	hex.Encode(enc[:], b)
	return string(enc)
}

func GenStoreContractDeployCode(storeName string, owner string) (string, error) {
	if len(owner) != 42 || !strings.HasPrefix(owner, "0x") {
		return "", errors.New("invalid owner: " + owner )
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		return "", err
	}

	inputParam, err := _abi.Constructor.Inputs.Pack(storeName, common.HexToAddress(owner))
	if err != nil {
		return "", err
	}

	txInput := storeContractDeployCode + Encode(inputParam)
	return txInput, nil
}

func RightPaddingZero(input string, byteSize int) string {
	if len(input) > byteSize*2 {
		return ""
	}
	ret := Encode([]byte(input))
	for len(ret) < byteSize*2 {
		ret += "0"
	}
	return ret
}

func SendHTTPRequest(method string, url string, bodyData []byte) (string, error) {
	req, err := http.NewRequest(method, url, bytes.NewBuffer(bodyData))
	if err != nil {
		return "", err
	}
	setDefaultHeader(req.Header)

	res, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}

	bodyContents, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	res.Body.Close()

	return string(bodyContents), nil
}


func callContract(to string, data string) (string, error) {
	bodyData, _ := json.Marshal(&kasKlaytnRPC{
		JsonRpc: "2.0",
		Method: "klay_call",
		Params: []interface{}{
			structCall{
				From: conf.KasAccount,
				To:   to,
				Gas:  "0x7A1200", // 8000000
				Data: data,
			},
			"latest",
		},
		Id: 1,
	})

	ret, err := SendHTTPRequest("POST", kasNodeUrl+"/v1/klaytn", bodyData)
	if err != nil {
		return "", err
	}
	return ret, nil
}

func getLogs(fromBlock string, toBlock string, contract string) ([]OrderReceipt, error) {
	bodyData, _ := json.Marshal(&kasKlaytnRPC{
		JsonRpc: "2.0",
		Method: "klay_getLogs",
		Params: []interface{}{
			structGetLogs{
				FromBlock: fromBlock,
				ToBlock:   toBlock,
				Address:   contract,
			},
		},
		Id: 1,
	})

	ret, err := SendHTTPRequest("POST", kasNodeUrl+"/v1/klaytn", bodyData)
	if err != nil {
		return nil, err
	}

	var logsJson RPCReturnInterface
	if err := json.Unmarshal([]byte(ret), &logsJson); err != nil {
		return nil, err
	}

	logsArray, ok := logsJson.Result.([]interface{})
	if !ok {
		return nil, errors.New("conversion failure: " + ret)
	}

	var receipts []OrderReceipt
	for _, log := range logsArray {
		logMap, ok := log.(map[string]interface{})
		if !ok {
			return nil, errors.New("conversion failure 2: " + ret)
		}

		_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
		if err != nil {
			return nil, err
		}

		var receipt OrderReceipt
		receiptData, ok := logMap["data"].(string)
		if !ok {
			return nil, errors.New("conversion failure 3: " + ret)
		}

		if err := _abi.Events["OrderReceipt"].Inputs.Unpack(&receipt,hexutil.MustDecode(receiptData)); err != nil {
			return nil, err
		}

		receiptTopics, ok := logMap["topics"].([]interface{})
		if !ok {
			return nil, errors.New("conversion failure 4: " + ret)
		}

		receipt.From = common.HexToAddress(receiptTopics[2].(string))
		index, err := strconv.ParseUint(receiptTopics[1].(string)[24:], 16, 64)
		if err != nil {
			return nil, err
		}
		receipt.Index = uint32(index)

		receipts = append(receipts, receipt)
	}

	return receipts, nil
}