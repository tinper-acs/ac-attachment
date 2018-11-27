## ac-attachment

### 1. 简介

附件上传组件(基于应用平台)

### 2. 安装

```bash
npm install ac-attachment -S
```

### 3. 使用
```javascript
import AcAttachment from 'ac-attachment';
import 'ac-attachment/build/ac-attachment.css';
```

```javascript
<AcAttachment fielpath='' groupname='' />
            
```
更多用法可以参考[demo](./demo/demolist)文件夹中的示例

> 注：组件基于应用平台的附件接口，接口需要登录，否则无法进行附件相关的任何操作

### 4. 预览


### 5. 参数

Parameter | Type | Default | Required | Description
--------- | ---- | ------|----------- | -----------------
filepath | `string` | | 是 | 单据相关的唯一标示，一般包含单据ID，如果有多个附件的时候由业务自己制定规则 
groupname | `string` |  | 是 | 分组名
permission | `string` |  | 否 | Oss权限(read，private，full),read是可读=公有，private=私有，当这个参数不传的时候会默认private
url | `string` |  | 否 | 里传true或false。为true，则返回附件的连接地址存到数据库中；如果isencrypt设置为true，url不能设置为true否则不能上传，提示：对于加密文件不能返回url，返回了也无法访问
isencrypt | `boolean` | `false` | 否 | 是否加密，默认false不加密
uploadUrl | `string` | `/iuap-saas-filesystem-service/file/upload` | 否 | 应用平台上传文件的地址
queryUrl | `string` | `/iuap-saas-filesystem-service/file/query` | 否 | 应用平台查询附件的地址
deleteUrl | `string` | `/iuap-saas-filesystem-service/file/delete` | 否 | 应用平台上传附件的地址
downloadUrl | `string` | `/iuap-saas-filesystem-service/file/download` | 否 | 应用平台下载附件的地址
fileType | `string`  |  | 否 |允许上传的文件类型, 详见 [input accept Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept)
fileMaxSize | `number` | 10 * 1024 * 1024 | 否 | 单个上传文件的大小上限，默认是10M


