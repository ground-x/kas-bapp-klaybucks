package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/klaytn/klaytn/accounts/abi"
	"github.com/klaytn/klaytn/common"
	"github.com/klaytn/klaytn/common/hexutil"
	"io/ioutil"
	"math/big"
	"net/http"
	"strconv"
)

type Config struct {
	Authorization string `json:"authorization"`
	KasAccount string `json:"kas_account"`
	MasterContract string `json:"master_contract"`
}

var conf = readConfig()

func main() {
	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	r.Use(cors.New(config))

	account := r.Group("/kas")
	{
		account.GET("/account", wallet_getAccount)
		account.POST("/account", wallet_createAccount)

		account.POST("/store", wallet_deployStoreContract)
		account.POST("/store/menu", wallet_executeAddMenu)
		account.POST("/store/order", wallet_executeOrder)
		account.POST("/store/approve", wallet_executeApproveOrder)
		account.POST("/store/deny", wallet_executeDenyOrder)
		account.POST("/store/reward", wallet_executeSetReward)

		account.POST("/storelist", wallet_deployStoreListContract)
		account.POST("/storelist/store", wallet_executeRegisterStore)
	}

	klaytn := r.Group("/node")
	{
		klaytn.POST("/klaytn", node_postRPC)
		klaytn.GET("/blockNumber", node_getBlockNumber)
		klaytn.GET("/balance", node_getBalance)
		klaytn.GET("/logs", node_getLogs)
		klaytn.GET("/receipt", node_getReceipt)
		klaytn.GET("/stores", node_getStores)
		klaytn.GET("/menu", node_getMenu)
		klaytn.GET("/order", node_getOrder)
		// klaytn.GET("/klaytn/reward", kasKlaytn_GetReward)
	}

	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}

func readConfig() Config {
	var conf Config
	data, err := ioutil.ReadFile("./config.json")
	if err != nil {
		panic(err)
	}
	if err := json.Unmarshal(data, &conf); err != nil {
		panic(err)
	}
	return conf
}

func setDefaultHeader(header http.Header) {
	header.Add("Content-Type", "application/json")
	header.Add("Authorization", conf.Authorization)
	header.Add("x-chain-id", "1001")
}

func wallet_getAccount(c *gin.Context){
	var getAcc FormGetAcc
	url := kasWalletUrl + "/v2/account"

	if c.ShouldBindQuery(&getAcc) != nil {
		c.String(-1, "invalid form")
		return
	}

	bodyData, _ := json.Marshal(&kasGetAcc{Address: getAcc.Id})

	ret, err := SendHTTPRequest("GET", url, bodyData)
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func wallet_createAccount(c *gin.Context){
	url := kasWalletUrl + "/v2/account"
	c.Header("Access-Control-allow-origin", "*")

	ret, err := SendHTTPRequest("POST", url, nil)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	c.JSON(200, ret)
}

func node_getBalance(c *gin.Context) {
	url := kasNodeUrl + "/v1/klaytn"
	c.Header("Access-Control-allow-origin", "*")

	var params FormAddress
	if err := c.ShouldBindQuery(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	bodyData, _ := json.Marshal(&kasKlaytnRPC{
		JsonRpc: "2.0",
		Method: "klay_getBalance",
		Params: []string{params.Address,"latest"},
		Id: 1,
	})

	ret, err := SendHTTPRequest("POST", url, bodyData)
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.JSON(200, ret)
}

func node_getBlockNumber(c *gin.Context) {
	url := kasNodeUrl + "/v1/klaytn"
	c.Header("Access-Control-allow-origin", "*")

	bodyData, _ := json.Marshal(&kasKlaytnRPC{
		JsonRpc: "2.0",
		Method: "klay_blockNumber",
		Params: []struct{}{},
		Id: 1,
	})

	ret, err := SendHTTPRequest("POST", url, bodyData)
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.JSON(200, ret)
}

func node_postRPC(c *gin.Context) {
	url := kasNodeUrl + "/v1/klaytn"
	c.Header("Access-Control-allow-origin", "*")

	bodyData, _ := json.Marshal(&kasKlaytnRPC{
		JsonRpc: "2.0",
		Method: "klay_blockNumber",
		Params: []struct{}{},
		Id: 1,
	})

	ret, err := SendHTTPRequest("POST", url, bodyData)
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func node_getReceipt(c *gin.Context) {
	url := kasNodeUrl + "/v1/klaytn"
	c.Header("Access-Control-allow-origin", "*")

	var params ParamGetTxReceipt
	if err := c.ShouldBindQuery(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	bodyData, _ := json.Marshal(&kasKlaytnRPC{
		JsonRpc: "2.0",
		Method: "klay_getTransactionReceipt",
		Params: []string{params.TxHash},
		Id: 1,
	})

	ret, err := SendHTTPRequest("POST", url, bodyData)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	c.String(200, ret)
}

func wallet_deployStoreListContract(c *gin.Context) {
	url := kasWalletUrl + "/v2/tx/fd/contract/deploy"

	bodyData, err := json.Marshal(&kasDeployTxFD{
		From:   conf.KasAccount,
		Value:  "0x0",
		Gas:    8000000,
		Input:  storeListContractDelpoyCode,
		Submit: true,
	})
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := SendHTTPRequest("POST", url, bodyData)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	c.String(200, ret)
}

func ExecuteContract(to string, input string) (string, error){
	txArgs := kasExecTxFD{
		From:     conf.KasAccount,
		Value:    "0x0",
		To:       to,
		GasLimit: 8000000,
		Submit:   true,
		Input:    input,
	}

	bodyData, _ := json.Marshal(&txArgs)
	ret, err := SendHTTPRequest("POST", kasWalletUrl+"/v2/tx/fd/contract/execute", bodyData)
	if err != nil {
		return "", err
	}
	return ret, nil
}

func wallet_executeOrder(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var params ParamOrder
	if err := c.ShouldBindJSON(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	// price ,err := strconv.Atoi(params.TotalPrice)
	// if err != nil {
	// 	c.String(-1, err.Error())
	// 	return
	// }
	//
	// inputParam, err := _abi.Pack("addOrder", params.Tid, params.Items, uint32(price))
	// if err != nil {
	// 	c.String(-1, err.Error())
	// 	return
	// }

	inputParam, err := _abi.Pack("addOrder", params.Tid, params.Items, params.TotalPrice)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := ExecuteContract(params.Contract, "0x" + Encode(inputParam))
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func wallet_executeApproveOrder(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var params FormOrderId
	if err := c.ShouldBindJSON(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	inputParam, err := _abi.Pack("approveOrder", params.OrderId, params.Reward)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := ExecuteContract(params.Contract, "0x" + Encode(inputParam))
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func wallet_executeDenyOrder(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var params FormOrderId
	if err := c.ShouldBindJSON(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	inputParam, err := _abi.Pack("denyOrder", params.OrderId)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := ExecuteContract(params.Contract, "0x" + Encode(inputParam))
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func wallet_executeSetReward(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var params FormAddReward
	if err := c.ShouldBindJSON(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	if len(params.RewardHex) % 2 == 1 {
		params.RewardHex = params.RewardHex[:2] + "0" + params.RewardHex[2:]
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	inputParam, err := _abi.Pack("setRewardPolicy", params.MenuId, new(big.Int).SetBytes(hexutil.MustDecode(params.RewardHex)))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := ExecuteContract(params.Contract, "0x" + Encode(inputParam))
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func wallet_executeAddMenu(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var params ParamAddMenu
	if err := c.ShouldBindJSON(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	// price ,err := strconv.Atoi(params.Price)
	// if err != nil {
	// 	c.String(-1, err.Error())
	// 	return
	// }
	//
	// inputParam, err := _abi.Pack("addMenu", params.Item, uint32(price))
	// if err != nil {
	// 	c.String(-1, err.Error())
	// 	return
	// }

	inputParam, err := _abi.Pack("addMenu", params.Item, params.Price)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := ExecuteContract(params.Contract, "0x" + Encode(inputParam))
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func wallet_deployStoreContract(c *gin.Context) {
	url := kasWalletUrl + "/v2/tx/fd/contract/deploy"
	c.Header("Access-Control-allow-origin", "*")

	var params ParamDeployStore
	if err := c.ShouldBindJSON(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	txInput, err := GenStoreContractDeployCode(params.Name,params.Owner)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	bodyData, err := json.Marshal(&kasDeployTxFD{
		From:   conf.KasAccount,
		Value:  "0x0",
		Gas:    8000000,
		Input:  txInput,
		Submit: true,
	})
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := SendHTTPRequest("POST", url, bodyData)
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func wallet_executeRegisterStore(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var params ParamRegisterStore
	if err := c.ShouldBindJSON(&params); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeListContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	fmt.Println(params)
	fmt.Println( common.HexToAddress(params.ContractAddr))

	inputParam, err := _abi.Pack("addStore", params.Name, params.X, params.Y,
		common.HexToAddress(params.Owner), common.HexToAddress(params.ContractAddr))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret, err := ExecuteContract(conf.MasterContract, "0x" + Encode(inputParam))
	if err != nil {
		c.String(-1, err.Error())
		return
	}
	c.String(200, ret)
}

func getMenu(addr string) ([]StoreMenu, error) {
	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		return nil, err
	}

	// 1. get the number of menu
	inputParam, err := _abi.Pack("getNumMenus")
	if err != nil {
		return nil, err
	}

	ret , err := callContract(addr, "0x" + Encode(inputParam))
	if err != nil {
		return nil, err
	}

	var rpcRet RPCReturnString
	if err := json.Unmarshal([]byte(ret), &rpcRet); err != nil {
		return nil, err
	}

	numMenu, err := strconv.ParseUint(rpcRet.Result[len(rpcRet.Result)-8:], 16, 64)
	if err != nil {
		return nil, err
	}

	// 2. get all menu
	var allMenu []StoreMenu
	// allMenu := make(map[uint64]StoreMenu)
	for i := uint64(0); i < numMenu; i++ {
		var menu StoreMenu

		inputParam, err := _abi.Pack("getMenu", uint32(i))
		if err != nil {
			return nil, err
		}

		ret , err = callContract(addr, "0x" + Encode(inputParam))
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal([]byte(ret), &rpcRet); err != nil {
			return nil, err
		}

		if err := _abi.Unpack(&menu, "getMenu", hexutil.MustDecode(rpcRet.Result)); err != nil {
			return nil, err
		}

		menu.Id = uint32(i)
		menu.RewardHex = hexutil.Encode(menu.Reward.Bytes())
		allMenu = append(allMenu, menu)
	}

	return allMenu, nil
}

func node_getMenu(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var txArgs FormAddress
	if err := c.ShouldBindQuery(&txArgs); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	menus, err := getMenu(txArgs.Address)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	c.JSON(200, menus)
}

func node_getStores(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	_abi , err := abi.JSON(bytes.NewBufferString(storeListContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	inputParam, err := _abi.Pack("getStores")
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret , err := callContract(conf.MasterContract, "0x" + Encode(inputParam))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	var rpcRet RPCReturnString
	if err := json.Unmarshal([]byte(ret), &rpcRet); err != nil {
		c.String(-1, err.Error())
		return
	}

	var arr []StoreInfoArray
	if err := _abi.Unpack(&arr, "getStores", hexutil.MustDecode(rpcRet.Result)); err != nil {
		fmt.Println(rpcRet.Result)
		fmt.Println(hexutil.MustDecode(rpcRet.Result))
		c.String(-1, err.Error())
		return
	}

	c.JSON(200, arr)
}

func node_getLogs(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var txArgs FormGetLogs
	if err := c.ShouldBindQuery(&txArgs); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	receipts , err := getLogs(txArgs.FromBlock, txArgs.ToBlock, txArgs.Contract)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	c.JSON(200, receipts)
}

func node_getOrder(c *gin.Context) {
	c.Header("Access-Control-allow-origin", "*")

	var txArgs FormOrderId
	if err := c.ShouldBindQuery(&txArgs); err != nil {
		c.String(-1, "invalid input data" + err.Error())
		return
	}

	_abi , err := abi.JSON(bytes.NewBufferString(storeContractABI))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	inputData, err := _abi.Pack("getOrder", txArgs.OrderId)
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	ret , err := callContract(txArgs.Contract, hexutil.Encode(inputData))
	if err != nil {
		c.String(-1, err.Error())
		return
	}

	var rpcRet RPCReturnString
	if err := json.Unmarshal([]byte(ret), &rpcRet); err != nil {
		c.String(-1, err.Error())
		return
	}

	var order Order
	if err := _abi.Unpack(&order, "getOrder", hexutil.MustDecode(rpcRet.Result)); err != nil {
		c.String(-1, err.Error())
		return
	}

	c.JSON(200, order)
}