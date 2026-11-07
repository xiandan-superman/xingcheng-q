const avatar=require('../../utils/avatar')
Component({properties:{shape:{type:String,value:'round'},color:{type:String,value:'xingcheng'},size:{type:Number,value:96}},data:{src:''},observers:{'shape,color':function(){this.update()}},lifetimes:{attached(){this.update()}},methods:{update(){this.setData({src:avatar.image(this.properties.shape,this.properties.color)})}}})
