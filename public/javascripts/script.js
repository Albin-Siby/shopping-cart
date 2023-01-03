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
            //alert(response)
        }
    });
}

function changeQuantity(cartId,proId,count) {
    count = parseInt(count)
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    $.ajax({
        url:"/change-product-quantity",
        data:{
            cart:cartId,
            product:proId,
            count:count,
            quantity:quantity
        },
        method:"post",
        success: (response) => {
            if(response.maxLimit) {
               alert("Maximum limit reached")
            } else {
                 document.getElementById(proId).innerHTML = quantity+count
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