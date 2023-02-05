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
                swal("Item Added to Cart!", "Your item has been added to your cart.", "success");
            }else if(response.error) {
                swal("Sorry, this item is currently out of stock", "", "info");
            } else {
                swal("Please login to continue!","", "warning");
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
               swal("warning","Maximum Limit is Reached","warning")
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
    swal({
        title: "Are you sure?",
        text: "Once deleted,  the action is irreversible!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        if (willDelete) {

            $.ajax({
                url: "/delete-cart-product",
                data: {
                    cart:cartId,
                    product: proId
                },
                method: "delete",
                success: (response) => {
                    if(response.removeStatus) {
                        document.getElementById(proId).style.display = "none"
                        location.reload()       
                    }
                }        
            })
            
        } else {
            swal({
                title: "Your product is safe!",
                icon: "success",
                button: "OK",
                content: {
                    element: "span",
                    attributes: {
                        style: "color: green; font-weight: bold;"
                    },
                },
            });
        }
      })
    
}