import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {bindAll,isNumber} from './common';
import AcUpload from 'ac-upload';
import 'ac-upload/build/ac-upload.css';

import Table from 'bee-table';
import multiSelect from "bee-table/build/lib/multiSelect.js";
import sort from 'bee-table/build/lib/sort.js';
import Button from 'bee-button';
import Checkbox from 'bee-checkbox';
import Popconfirm from 'bee-popconfirm';
import Icon from 'bee-icon';
import Message from 'bee-message';
import axios from 'axios';
import './index.scss';

let MultiSelectSortTable  = multiSelect(sort(Table, Icon), Checkbox);

const propTypes = {
	recordId: PropTypes.string,
    groupname: PropTypes.string,
    permission: PropTypes.oneOf(['read','private','full']),
    tenant: PropTypes.string,
    url: PropTypes.bool,
    baseUrl: PropTypes.string,
	uploadUrl: PropTypes.string,
	queryUrl: PropTypes.string,
	deleteUrl: PropTypes.string,
    downloadUrl: PropTypes.string,
    fileType: PropTypes.string,
    onFileTypeOver: PropTypes.func,
    fileMaxSize: PropTypes.number,
    onFileSizeOver: PropTypes.func,
    fileNum: PropTypes.number,
    onFileNumOver: PropTypes.func,
    className: PropTypes.string,
    multiple: PropTypes.bool,
    onDelete: PropTypes.func
}

const defaultProps = {
    baseUrl: '',
	uploadUrl: '/iuap-saas-filesystem-service/file/upload',
	queryUrl: '/iuap-saas-filesystem-service/file/query',
	deleteUrl: '/iuap-saas-filesystem-service/file/delete',
    downloadUrl: '/iuap-saas-filesystem-service/file/download',
    batchDeleteUrl: '/iuap-saas-filesystem-service/file/batchDeleteByIds',
    fileMaxSize: 10, //默认10M
    multiple: true,
    fileNum: 999
}

class AcAttachment extends Component{
    constructor(props){
		super(props);
		this.state = {
            fileList: [],
            action: props.uploadUrl,
            selectedFiles: []
        }
        this.selectedFiles = [];
        this.fileTypeIcons = ['css','doc','html','javascript','jpg','pdf','png','ppt','xls','xml'];
        bindAll(this,['fGetTableColumns','fLoadFileList','fDeleteFile','fUploadSuccess','fUploadDelete',
                      'fDownload','fDelete','fGetSelectedData','fConClick','beforeUpload','fValidateFileType']);
    }
    get uploadUrl(){
        return `${this.props.baseUrl}${this.props.uploadUrl}?t=${new Date().getTime()}`;
    }
    get queryUrl(){
        return `${this.props.baseUrl}${this.props.queryUrl}?t=${new Date().getTime()}`;
    }
    get deleteUrl(){
        return `${this.props.baseUrl}${this.props.deleteUrl}?t=${new Date().getTime()}`;
    }
    get downloadUrl(){
        return `${this.props.baseUrl}${this.props.downloadUrl}?t=${new Date().getTime()}`;
    }
    get batchDeleteUrl(){
        return `${this.props.baseUrl}${this.props.batchDeleteUrl}?t=${new Date().getTime()}`;
    }
    get fileMaxSize(){
        return this.props.fileMaxSize * 1024 * 1024;
    }
    componentWillReceiveProps(nextProps){
        //单据Id变化刷新文件列表
        if(nextProps.recordId && nextProps.recordId != this.props.recordId){
            this.fLoadFileList(nextProps);
        }
    }
	componentDidMount(){
		this.fLoadFileList();
    }
	fLoadFileList(nextProps){
        const self = this;
        const {recordId,groupname,tenant} = nextProps || self.props;
        if(recordId && groupname){
            const params = {
                filepath: recordId,
                groupname: groupname,
            }
            if(tenant){
                params['tenant'] = tenant;
            }
    
            return axios({
                url: self.queryUrl,
                params: params
            }).then(function(res){
                if(res.data){
                    self.setState({
                        fileList: res.data.data
                    })
                }
            }).catch(function (error) {
                console.log(error);
            });
        }
    }
    fDeleteFile(id){
		const self = this;

        return axios({
            url: self.deleteUrl,
            params: {
                id: id
            }
        }).then(function(res){
            return res;
        }).catch(function (error) {
            console.log(error);
        });
    }
    fBatchDeleteFiles(ids){
        const self = this;
        if(Array.isArray(ids)){
            ids = ids.join(',');
        }

        return axios({
            url: self.batchDeleteUrl,
            params: {
                ids: ids
            }
        }).then(function(res){
            return res;
        }).catch(function (error) {
            console.log(error);
        });
    }
	//成功之后添加文件进列表
    fUploadSuccess = (data) => {
        const self = this;
        self.fLoadFileList();
    }
    fUploadDelete(data){
        const file = data;
        this.fDeleteFile(file.id).then(() => {
            this.fLoadFileList(); 
        });
    }
    fDownload(){
        const downloadUrl = this.downloadUrl;
        //打开多个窗口，会被拦截，需要手动允许
        this.selectedFiles.forEach((item) => {
            window.open(downloadUrl + '&id=' + item.id);
        });
    }
    fDelete(){
        const ids = this.selectedFiles.map((item) => item.id);
        this.fBatchDeleteFiles(ids).then(() => {
            this.fLoadFileList();
            this.setState({
                selectedFiles: []
            })
        });
    }
    fGetSelectedData(data){
        this.selectedFiles = data;
        this.setState({
            selectedFiles: data
        })
    }
	fGetTableColumns(){
        const self = this;
        const downloadUrl = self.downloadUrl;

		const columns = [
            { title: '', dataIndex: '', key: '', width: 50, 
              render(text, record, index) {
                return (
                  <a href={downloadUrl + '&id=' + record.id} target="_blank">
                    <Icon className="uf-cloud-down"></Icon>
                  </a>
                );
              }
            },
            { title: '附件名称', dataIndex: 'filename', key: 'filename', width: 200, 
                sorter:function(a,b){
                    return a.filename.localeCompare(b.filename);
                }
            },
            { title: '文件类型', dataIndex: 'filetype', key: 'filetype', width: 100, render(text, record, index) {
                let ext = record.filetype;
                let filetypeCls = 'upload-filetype-' + ext;
                let hasIcon = self.fileTypeIcons.indexOf(ext) > -1;

                return (
                    <React.Fragment>
                        {hasIcon ? <span className={'upload-filetype ' + filetypeCls}></span> : <span>{ext}</span>}
                    </React.Fragment>
                );
              }
            },
            { title: '文件大小', dataIndex: 'filesize', key: 'filesize', width: 100, 
                sorter: function(a,b){
                    const reg = /^([\d.]+)([\w()]+)$/;
                    const matchA = a.filesize.match(reg),
                          matchB = b.filesize.match(reg);
                    if(matchA && matchB){
                        const numA = matchA[1],
                              unitA = matchA[2],
                              numB = matchB[1],
                              unitB = matchB[2];
                        if(numA && unitA && numA && unitB){
                            if(numA == numB && unitA == unitB){
                                return 0;
                            }
                            return self.fConvertFileSize(numA,unitA) > self.fConvertFileSize(numB,unitB) ? 1 : -1;
                        }
                    }
                    return 1;
                }
            },
            { title: '上传人', dataIndex: 'uploaderName', key: 'uploaderName', width: 100, 
                sorter:function(a,b){
                    return a.uploaderName.localeCompare(b.uploaderName);
                }
            },
            { title: '上传时间', dataIndex: 'uploadtime', key: 'uploadtime', width: 200,
                sorter:function(a,b){
                    return self.fCompareUploadTime(a,b);
                }
            }
		];

		return columns;
    }
    fConvertFileSize(numA,unitA){
        switch(unitA){
            case 'MB':
                numA = numA * 1024 * 1024;
                break;
            case 'KB':
                numA = numA * 1024;
                break;
            default:
                break;
        }

        return numA;
    }
    fCompareUploadTime(a,b){
        let aDate = +new Date(a.uploadtime),
            bDate = +new Date(b.uploadtime);
        if(aDate == bDate){
            return 0;
        }
        return aDate > bDate ? 1 : -1;
    }
    fGetBtnByProp(prop){
        const {children} = this.props;
        let btn = null;
        if(children){
            React.Children.forEach(children,function(item){
                if(item.props['data-btn'] == prop){
                    btn = item;
                }
            });
        }
        return btn;
    }
    fGetBtnByType(type,disabled){
        let btn = this.fGetBtnByProp(type);
        if(!btn){
            let map = {
                'upload':  (
                    <Button data-btn="upload" colors="primary" className="upload-btn" size='sm'>
                        <Icon className="uf-upload"></Icon>上传
                    </Button>
                ),
                'download': (
                    <Button data-btn="download" colors="primary" className="upload-btn" size='sm'>
                        <Icon className="uf-download"></Icon>下载
                    </Button>
                ),
                'delete': (
                    <Button data-btn="delete" colors="primary" className="upload-btn" size='sm'>
                        <Icon className="uf-del"></Icon>删除
                    </Button>
                )
            };
            btn = map[type];
        }
        
        if(type != 'upload'){
            btn = React.cloneElement(btn,{disabled:disabled});
        }
        if(type == 'delete'){
            btn = this.renderDel(btn);
        }

        return btn;
    }
    fConClick(ev){
        const dataBtn = ev.target.getAttribute('data-btn');

        switch(dataBtn){
            case 'download':
                this.fDownload();
                break;
            case 'delete':
                if(!this.props.onDelete){
                    this.fDelete();
                }
                break;
            default:
                break;
        }
    }
    renderDel(btn){
        let {onDelete} = this.props;
        btn = onDelete ? React.cloneElement(btn,{onClick:(ev) => {onDelete(this)}}) : btn;
        return (
            btn
        )
    }
    fValidateFileType(fileType){
        const accept = this.props.fileType;
        if(!accept){
            return true;
        }
        const accepts = accept.split(',');
        let valid = false;
        //若直接包含，则允许，若有前面类型相同，后为*的，也是允许
        for(let i=0,len=accepts.length;i<len;i++){
            let item = accepts[i];
            if(item == fileType){
                valid = true;
                break;
            }
            if(item.indexOf('*') > -1){
                const aAccept = item.split('/');
                const aType = fileType.split('/');
                if(aAccept.length > 1 && aType.length > 1){
                    valid = aAccept[0] == aType[0] && aAccept[1] == '*';
                }
            }
        }

        return valid;
    }
    beforeUpload(file){
        //文件大小检查
        if(file.size > this.fileMaxSize){
            Message.create({content: `文件大小超出限制(${this.props.fileMaxSize}M)`, color: 'warning'});
            this.props.onFileSizeOver && this.props.onFileSizeOver(file);
            return false;
        }
        //文件类型检查
        if(!this.fValidateFileType(file.type)){
            Message.create({content: '文件类型超出限制', color: 'warning'});
            this.props.onFileTypeOver && this.props.onFileTypeOver(file);
            return false;
        }
        //文件数量检查
        let {fileNum} = this.props;
        if(fileNum){
            let fileList = this.state.fileList || [];
            fileNum = parseInt(fileNum);
            if(fileList.length + 1 > fileNum){
                Message.create({content: `文件数量超出限制(${fileNum}个)`, color: 'warning'});
                this.props.onFileNumOver && this.props.onFileNumOver(file);
                return false;
            }
        }

        return true;
    }
	render(){
		const columns = this.fGetTableColumns();
        let {fileList,selectedFiles} = this.state;
        fileList = fileList || [];
        selectedFiles = selectedFiles || [];

        let {recordId,groupname,permission,url,fileType,className,multiple} = this.props;
        let fileMaxSize = this.fileMaxSize;
		let uploadData = {
			filepath: recordId,
			groupname: groupname
        };
        if(permission){
            uploadData['permission'] = permission;
        }
        if(url){
            uploadData['url'] = url;
        }

        let uploadUrl = this.uploadUrl;
        // let uploadList = fileList.map(function(item){
        //     return {
        //         id: item.id,
        //         fileName: item.filename,
        //         accessAddress: downloadUrl + '&id=' + item.id
        //     }
        // });

        let tableList = fileList.map(function(item){
            const regExt = /\.(\w+)$/;
            let filetypeMatch = item.filename.match(regExt);
            let filetype = filetypeMatch ? filetypeMatch[1] : '';
            //修复table的checkbox不选中bug
            let _checked = false;
            selectedFiles.forEach((sf) => {
                if(sf.id == item.id){
                    _checked = sf._checked;
                }
            })
            return {
                ...item,
                key: item.id,
                uploaderName: item.uploaderName,
                filetype: filetype,
                _checked: _checked               
            }
        });
        //数据按照上传时间倒序
        tableList.sort(this.fCompareUploadTime);
        
        //按钮禁用
        let battchEnable = selectedFiles && selectedFiles.length > 0;
        let btnDisabled = !battchEnable;
        //获取按钮
        let btnUpload = this.fGetBtnByType('upload',btnDisabled);
        let btnDownload = this.fGetBtnByType('download',btnDisabled);
        let btnDelete = this.fGetBtnByType('delete',btnDisabled);

        const emptyFunc = () => <i className="uf uf-nodata" style={{fontSize:'60px'}}></i>;

		return (
			<div className={className} onClick={this.fConClick}>
				<AcUpload
					title={'附件管理'}
					action={uploadUrl}
					data={uploadData}
					// defaultFileList={uploadList}
					multiple={multiple}
                    isView={false}
                    accept={fileType}
                    maxSize={fileMaxSize}
                    beforeUpload={this.beforeUpload}
					onError={(err) => {console.log(err);Message.create({content: '上传报错了', color: 'danger'});}}
					onSuccess={this.fUploadSuccess}
					onDelete={this.fUploadDelete}
				>
                    {btnUpload}
                </AcUpload>
                {btnDownload}
                {btnDelete}
                <MultiSelectSortTable
                    bordered
                    className='upload-table'
					columns={columns}
                    data={tableList}
                    multiSelect={{type:'checkbox'}}
                    getSelectedDataFunc={this.fGetSelectedData}
                    emptyText={emptyFunc}
				/>
			</div> 
		)
	}
}

AcAttachment.propTypes = propTypes;
AcAttachment.defaultProps = defaultProps;


export default AcAttachment;
