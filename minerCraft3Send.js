import Minercraft from 'minercraft';
import filepay from 'filepay';

//TaalとMatterでfeeを確認後、それでfeeを計算する。その後安い方で、ブロードキャストする。txをoutput（consoleで）
export default async function handler(req, res) {
	//KEY情報
	const privateKey = '<private key>';

	//BCに何をするかブロードキャスト前のtxを取得
	const tx = {
		safe: true,
		data: ["0x6d02", "doge eos eth bch btc Hello Filepay!!"],
		pay: { key: privateKey }
	}
	filepay.build(tx, async function(err, tx, fee) {
		const pre_tx = tx.toString()

		console.log("Pre TX = ", pre_tx)

		//各マイナーに手数料を確認
		const taal = new Minercraft({
			"url": "https://merchantapi.taal.com"
		})
		const matter = new Minercraft({
			url: "https://merchantapi.matterpool.io"
		})
		let rate_taal = await taal.fee.rate()
		let rate_matter = await matter.fee.rate()
		console.log("taal fee rate:", rate_taal)
		console.log("matter fee rate:", rate_matter)

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
	});

	res.status(200).json(true)
}
