import fetch from 'node-fetch';
import FormData from 'form-data';

const { AWS_POLICY, AWS_SIGNATURE } = process.env;

/**
 *
 * @param {string} content
 */
export async function doUpload(content) {
	if (!AWS_POLICY || !AWS_SIGNATURE) {
		throw new Error('AWS env variables not set');
	}

	/** @type {Record<string,string>} */
	const fields = {
		key: 'sites.json',
		bucket: 'data.getatest.nyc',
		'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
		'X-Amz-Credential': 'AKIARPGORSPIKGAZ2ZG2/20211220/us-east-1/s3/aws4_request',
		'X-Amz-Date': '20211220T051406Z',
		Policy: AWS_POLICY,
		'X-Amz-Signature': AWS_SIGNATURE
	};
	// {
	//     url: 'https://s3.amazonaws.com/data.getatest.nyc',
	//     fields: {
	//       key: 'sites.json',
	//       bucket: 'data.getatest.nyc',
	//       'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
	//       'X-Amz-Credential': 'AKIARPGORSPIKGAZ2ZG2/20211220/us-east-1/s3/aws4_request',
	//       'X-Amz-Date': '20211220T051406Z',
	//       Policy: 'eyJleHBpcmF0aW9uIjoiMjAyNS0xMi0xOVQwNToxNDowNloiLCJjb25kaXRpb25zIjpbWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMCwyMDk3MTUyMF0sWyJzdGFydHMtd2l0aCIsIiRDb250ZW50LVR5cGUiLCJhcHBsaWNhdGlvbi9qc29uIl0seyJrZXkiOiJzaXRlcy5qc29uIn0seyJidWNrZXQiOiJkYXRhLmdldGF0ZXN0Lm55YyJ9LHsiWC1BbXotQWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LHsiWC1BbXotQ3JlZGVudGlhbCI6IkFLSUFSUEdPUlNQSUtHQVoyWkcyLzIwMjExMjIwL3VzLWVhc3QtMS9zMy9hd3M0X3JlcXVlc3QifSx7IlgtQW16LURhdGUiOiIyMDIxMTIyMFQwNTE0MDZaIn1dfQ==',
	//       'X-Amz-Signature': '44fc822e3e2ff5f5a3819c082d1d18886ea13bd1a82fcdb17bd84c1eac554cc6'
	//     }
	//   }
	const formData = new FormData();

	for (const key in fields) {
		formData.append(key, fields[key]);
	}
	formData.append('Content-Type', 'application/json');
	formData.append('file', content, { contentType: 'application/json' });

	const res = await fetch('https://s3.amazonaws.com/data.getatest.nyc', {
		method: 'POST',
		body: formData
	});
	if (!res.ok) {
		console.log('not-ok');
		// throw new Error('Upload failed');
	}
	const txt = await res.text();
	console.log('text', txt);
	console.log('S3 upload successful');
}
