# minercraft(mAPI) + filepayで問い合わせてからブロードキャストする
# minercraft-filepay

マイナークラフト
https://minercraft.network/

filepay
https://github.com/MatterCloud/filepay

## mAPIとは
mAPIはマイナーにタスクいくらですか？ってきいてプッシュまでできる規格API

## filepayは
ブロックチェーンにデータいれたり支払ったりできる便利なライブラリ

## 流れ

nextjsのAPIで試しています。API環境にしているのは、これ以外の得意な環境で他の処理を構築できるため。
```
import Minercraft from 'minercraft';
import filepay from 'filepay';
```
上記はそんな環境なので、上二つを読み込むだけで済む。

### 1. filepay.buildでprivateKey付きでtxをつくる。

秘密鍵を指定します。残高も多少入れます。1000satoshiあれば今回のサンプルは十分かな。
```
//KEY情報
const privateKey = '<private key>';
```
ブロードキャストするって分かりますか？ブロックチェーンに上げる前と後でマイナーとやり取りしています。
ブロードキャストっていうのはブロックチェーンに上げた後です。
filepayではブロードキャストするまで一気に処理するのを"filepay.send"。手前までは"filepay.build"で
記述します。
```
//BCに何をするかブロードキャスト前のtxを取得
const tx = {
	safe: true,
	data: ["0x6d02", "doge eos eth bch btc Hello Filepay!!"],
	pay: { key: privateKey }
}
filepay.build(tx, async function(err, tx, fee) {
	const pre_tx = tx.toString()
  ...
  ...
});
```
今回はmAPIでマイナーに費用を問い合わせしますのでsendではなくbuildで記述します。
上記はマイナーに問い合わせるトランザクション(pre_tx)を作成している感じです。
"0x6d02"はmemo.cashに上げるためのサインです。なので入れなくていいと思います。

### 2. 各マイナーに手数料を確認する
```
//各マイナーに手数料を確認
const taal = new Minercraft({
	"url": "https://merchantapi.taal.com"
})
const matter = new Minercraft({
	url: "https://merchantapi.matterpool.io"
})
let rate_taal = await taal.fee.rate()
let rate_matter = await matter.fee.rate()
```
これはマイナクラフトにある例で、Taal社、Mattar社に相場を聞いています。
```
//pre_txでおいくらか計算
//Taal
let fee_taal = taal.fee.get({
	rate: rate_taal.mine,  // use the mining rate
	tx: pre_tx
})
console.log("Taal Fee = ", fee_taal)

//Matter
let fee_matter = matter.fee.get({
	rate: rate_matter.mine,  // use the mining rate
	tx: pre_tx
})
console.log("Matter Fee = ", fee_matter)
```
これはpre_txを添えて、この仕事いくらですか？って感じです。

### 3. 安い方でブロードキャストする
```
//安い方でブロードキャスト
if(fee_taal < fee_matter) {//Taaでブロキャス
	console.log("Taal Push.")
	let response = await taal.tx.push(pre_tx, {
		verbose: true
	})
	console.log("response:", response)
} else {//Mattaでブロキャス
	console.log("Matter Push.")
	let response = await matter.tx.push(pre_tx, {
		verbose: true
	})
	console.log("response:", response)
}
```
易しいですね。非常に分かりやすい。安い方で、マイナクラフトでpushしています。
ここまでくると、あとはこれをどう肉付けしていくかって話ですね。
responseにはtxidも入っています。
