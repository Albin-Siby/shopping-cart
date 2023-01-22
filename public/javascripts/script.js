// Ajax ......

function addToCart(proId) {
    $.ajax({
        url:"/add-to-cart/"+proId,
        type: 'get',
        success: (response) => {
            if(response.status) {
                let count = $("#cart-count").html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            }
        }
    });
}

function changeQuantity(cartId,proId,userId,count) {
    count = parseInt(count)
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    $.ajax({
        url:"/change-product-quantity",
        data:{
            cart:cartId,
            product:proId,
            user:userId,
            count:count,
            quantity:quantity
        },
        method:"post",
        success: (response) => {
            if(response.maxLimit) {
               alert("Maximum limit reached")
            } else {
                 document.getElementById(proId).innerHTML = quantity+count
                 document.getElementById('subtotal').innerHTML = response.subtotal
                 document.getElementById('subtotal1').innerHTML = response.subtotal

                let productTotal;
                for (let i = 0; i < response.total.length; i++) {
                    if (response.total[i].item == proId) {
                        
                        if(response.total[i].offerTotal != '') {
                            productTotal = response.total[i].offerTotal;
                            break;
                        } else {
                            productTotal = response.total[i].total;
                            break;
                        }
                         
                    }
                }
                 
                 if (productTotal) {
                     document.getElementById('total-price-' + proId).innerHTML = productTotal;
                 }
                 
            }
        }
    })
}

function deleteCartProduct(cartId, proId) {
    $.ajax({
        url: "/delete-cart-product",
        data: {
            cart:cartId,
            product: proId
        },
        method: "delete",
        success: (response) => {
            if(response.removeStatus) {
                alert("Are you sure to delete")
                document.getElementById(proId).style.display = "none"
                location.reload()
            }
        }
    })
}